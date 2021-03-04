const child = require('child_process')
const path = require('path')
const Handler = require('./handler')
const fs = require('fs')
const EventEmitter = require('events').EventEmitter

class EMCCore extends EventEmitter {
  async launch (options) {
    this.options = options
    this.options.root = path.resolve(this.options.root)
    this.options.overrides = {
      detached: true,
      ...this.options.overrides,
      url: {
        meta: 'https://launchermeta.mojang.com',
        resource: 'https://resources.download.minecraft.net',
        mavenForge: 'http://files.minecraftforge.net/maven/',
        defaultRepoForge: 'https://libraries.minecraft.net/',
        fallbackMaven: 'https://search.maven.org/remotecontent?filepath=',
        ...this.options.overrides
          ? this.options.overrides.url
          : undefined
      }
    }
    this.options.fw = {
      baseUrl: 'https://github.com/ZekerZhayard/ForgeWrapper/releases/download/',
      version: '1.4.2',
      sh1: '79ff9c1530e8743450c5c3ebc6e07b535437aa6e',
      size: 22346
    }

    this.handler = new Handler(this)

    var self = this;

    if (!fs.existsSync(this.options.root)) {
      this.emit('debug', `[EMC]: Attempting to create root folder`)
      fs.mkdirSync(path.join(this.options.root, "runtime", "java"), {recursive: true})
    }

    if (fs.existsSync(path.join(__dirname, '..', 'package.json'))) {
      this.emit('debug', `[EMC]: EMC version ${JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), { encoding: 'utf8' })).version}`)
    } else { this.emit('debug', '[EMC]: Package JSON not found, skipping EMC version check.') }
    const java = await this.handler.checkJava(this.options.javaPath || 'java')
    let hasJava = true;
    if (!java.run) {
        if(!fs.existsSync(path.join(this.options.root, "runtime", "java", "bin"))) {
            this.emit('debug', `[EMC]: Couldn't find java, download it at ${this.options.root}`)
            await this.handler.downloadJava();
        }
        hasJava = false;
    }

    await this.handler.listFiles();
    await this.handler.checkFiles();
    await this.handler.downloadFiles();

    const directory = path.join(this.options.root, 'versions', this.options.version)
    this.options.directory = directory

    const versionFile = await this.handler.getVersion()
    const mcPath = path.join(directory, `${this.options.version}.jar`)
    
    this.options.mcPath = mcPath
    const nativePath = await this.handler.getNatives()

    let modifyJson = null
    if (this.options.forge) {
      //this.emit('debug', '[EMC]: Detected Forge in options, getting dependencies')
      //modifyJson = await this.handler.getForgedWrapped()
    }
    if(this.options.forge) {
      this.emit('debug', '[EMC]: Setting up version file')
      modifyJson = JSON.parse(fs.readFileSync(path.join(this.options.root, 'versions', this.options.forge, `${this.options.forge}.json`), { encoding: 'utf8' }))
    }
    

    const args = []

    let jvm = [
      '-XX:-UseAdaptiveSizePolicy',
      '-XX:-OmitStackTraceInFastThrow',
      '-Dfml.ignorePatchDiscrepancies=true',
      '-Dfml.ignoreInvalidMinecraftCertificates=true',
      `-Djava.library.path=${nativePath}`,
      `-Xmx${this.handler.getMemory()[0]}`,
      `-Xms${this.handler.getMemory()[1]}`
    ]
    if (this.handler.getOS() === 'osx') {
      if (parseInt(versionFile.id.split('.')[1]) > 12) jvm.push(await this.handler.getJVM())
    } else jvm.push(await this.handler.getJVM())

    if (this.options.customArgs) jvm = jvm.concat(this.options.customArgs)

    const classes = this.options.overrides.classes || this.handler.cleanUp(await this.handler.getClasses(modifyJson))
    const classPaths = ['-cp']
    const separator = this.handler.getOS() === 'windows' ? ';' : ':'
    this.emit('debug', `[EMC]: Using ${separator} to separate class paths`)
    // Handling launch arguments.
    const file = modifyJson || versionFile
    // So mods like fabric work.
    const jar = fs.existsSync(mcPath)
      ? `${separator}${mcPath}`
      : `${separator}${path.join(directory, `${this.options.version}.jar`)}`
    classPaths.push(`${this.options.forge ? this.options.forge + separator : ''}${classes.join(separator)}${jar}`)
    classPaths.push(file.mainClass)

    // Forge -> Custom -> Vanilla
    const launchOptions = await this.handler.getLaunchOptions(modifyJson)

    const launchArguments = args.concat(jvm, classPaths, launchOptions)
    this.emit('arguments', launchArguments)
    this.emit('debug', `[EMC]: Launching with arguments ${launchArguments.join(' ')}`)

    this.emit('launch', "launch");

    const minecraft = child.spawn(this.options.javaPath ? this.options.javaPath : 'java', launchArguments,
      { cwd: this.options.overrides.cwd || this.options.root, detached: this.options.overrides.detached })
    minecraft.stdout.on('data', (data) => this.emit('data', data.toString('utf-8')))
    minecraft.stderr.on('data', (data) => this.emit('data', data.toString('utf-8')))
    minecraft.on('close', (code) => this.emit('close', code))

    return minecraft
  }
}

module.exports = EMCCore