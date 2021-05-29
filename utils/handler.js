const fs = require('fs')
const path = require('path')
const request = require('request')
const checksum = require('checksum')
const Zip = require('adm-zip')
const child = require('child_process')
const fetch = require('node-fetch')
const remote = require('remote-file-size')
let counter = 0

let filesToDownload;
let remoteFiles;
let downloadedFiles = 0;
let sizeToDownload = 0;
let downloadedBytes = 0;

class Handler {
  constructor (client) {
    this.client = client
    this.options = client.options
    this.baseRequest = request.defaults({
      pool: { maxSockets: this.options.overrides.maxSockets || 2 },
      timeout: this.options.timeout || 10000,
    })
  }

  checkJava (java) {
    return new Promise(resolve => {
      child.exec(`"${java}" -version`, (error, stdout, stderr) => {
        if (error) {
          resolve({
            run: false,
            message: error
          })
        } else {
          this.client.emit('debug', `[EMC]: Using Java version ${stderr.match(/"(.*?)"/).pop()} ${stderr.includes('64-Bit') ? '64-bit' : '32-Bit'}`)
          resolve({
            run: true
          })
        }
      })
    })
  }

  

  downloadAsync (url, directory, name, retry, type) {
    return new Promise(resolve => {
      fs.mkdirSync(directory, { recursive: true })

      const _request = this.baseRequest(url)

      let receivedBytes = 0
      let totalBytes = 0

      _request.on('response', (data) => {
        if (data.statusCode === 404) {
          this.client.emit('debug', `[EMC]: Failed to download ${url} due to: File not found...`)
          resolve({
            failed: true,
            error: 'file not found',
            asset: null
          })
        }

        totalBytes = parseInt(data.headers['content-length'])
      })

      _request.on('error', async (error) => {
        this.client.emit('debug', `[EMC]: Failed to download asset to ${path.join(directory, name)} due to\n${error}.` +
                    ` Retrying... ${retry}`)
        if (retry) await this.downloadAsync(url, directory, name, false, type)
        resolve({
          failed: true,
          error: error,
          asset: null
        })
      })

      _request.on('data', (data) => {
        receivedBytes += data.length
        downloadedBytes += data.length
        this.client.emit('download-status', {
          name: name,
          type: type,
          currentDownloadedBytes: receivedBytes,
          currentBytesToDownload: totalBytes,
          downloadedBytes: downloadedBytes,
          bytesToDownload: sizeToDownload,
          downloadFiles: downloadedFiles,
          filesToDownload: filesToDownload.length
        })
      })

      const file = fs.createWriteStream(path.join(directory, name))
      _request.pipe(file)

      file.once('finish', () => {
        this.client.emit('download', name)
        resolve({
          failed: false,
          downloadedBytes: totalBytes,
          error: null,
          asset: null
        })
      })

      file.on('error', async (e) => {
        this.client.emit('error', `[EMC]: Failed to download asset to ${path.join(directory, name)} due to\n${e}.` +
                    ` Retrying... ${retry}`)
        if (fs.existsSync(path.join(directory, name))) fs.unlinkSync(path.join(directory, name))
        if (retry) await this.downloadAsync(url, directory, name, false, type)
        resolve({
          failed: true,
          error: e,
          asset: null
        })
      })
    })
  }

  getVersion () {
    return new Promise(resolve => {
      const versionJsonPath = path.join(this.options.directory, `${this.options.version}.json`)
      if (fs.existsSync(versionJsonPath)) {
        this.version = JSON.parse(fs.readFileSync(versionJsonPath))
        return resolve(this.version)
      }
    })
  }

  async downloadJava() {
    let javaDir = path.join(this.options.root, 'runtime')
    await this.downloadAsync(this.options.url + "java/java.zip", javaDir, "java.zip", true, "java");
    this.client.emit('debug', '[EMC]: Extrating java');
    try {
        new Zip(path.join(javaDir, "java.zip")).extractAllTo(path.join(javaDir, "java"), true);
    } catch (e) {
        console.warn(e)
    }
    fs.unlinkSync(path.join(javaDir, "java.zip"));
  }

  getPath(pt) {
    let p = "";
    for(let i=1;i<pt.length-1;i++) {
      p += pt[i] + path.sep;
    }
    return p.slice(0, -1);
  }

  downloadFile(file) {
    return new Promise(resolve => {
      let pt = file.split("/");
      let type = pt[1];
      if(!fs.existsSync(path.join(this.options.root, this.getPath(pt)))) {
        fs.mkdirSync(path.join(this.options.root, this.getPath(pt)), {recursive: true});
      }
      this.downloadAsync(this.options.url + file, path.join(this.options.root, this.getPath(pt)), pt[pt.length-1], true, type).then(data => {
        downloadedFiles++;
        resolve(data.downloadedBytes);
      })
    });
  }

  getFileSize(url) {
    return new Promise(resolve => {
      remote((this.options.url + url), function(err, o) {
        resolve(o);
      })
    });
  }


  async checkFiles(checkFiles) {
    return new Promise(resolve => {
      this.client.emit("debug", "[EMC]: Checking files");
      let i = 0;
      let l = remoteFiles.length;
      filesToDownload = [];
      if(l == 0) {
        resolve();
      }
      for(let url of remoteFiles) {
        let pt = url.split("/");
        if(checkFiles) {
          this.getFileSize(url).then(size => {
            i++;
            this.client.emit('verification-status', {
              name: url,
              current: i,
              total: l
            })
            let p = path.join(this.options.root, this.getPath(pt), pt[pt.length-1]);
  
            if(!fs.existsSync(p)) {
              filesToDownload.push(url);
              if(size != undefined) {
                sizeToDownload = sizeToDownload + size;
              }
            }else {
              const stats = fs.statSync(p);
              const fileSizeInBytes = stats.size;
  
              if(fileSizeInBytes !== size && size != undefined) {
                this.client.emit("debug", "[EMC]: FileDeleter : " + p + ")");
                fs.unlinkSync(p);
                filesToDownload.push(url);
                if(size != undefined) {
                  sizeToDownload = sizeToDownload + size;
                }
              }
            }
            if(i >= l) {
              resolve();
            }
          })
        }else {
          this.client.emit('verification-status', {
            name: url,
            current: i,
            total: l
          })
          let p = path.join(this.options.root, this.getPath(pt), pt[pt.length-1]);

          if(!fs.existsSync(p)) {
            this.getFileSize(url).then(size => {
              filesToDownload.push(url);
              if(size != undefined) {
                sizeToDownload = sizeToDownload + size;
              }
              i++;
              if(i >= l) {
                resolve();
              }
            }).catch(error => {
              i++;
              if(i >= l) {
                resolve();
              }
            })
          }else {
            i++;
            if(i >= l) {
              resolve();
            }
          }
        }        
      }
    });
  }

  async listFiles() {
    return new Promise(resolve => {
      this.client.emit("debug", "[EMC]: Listing files to download");
      let url = this.options.url + "reader.php";

      fetch(url)
      .then(response => response.text())
      .then(data => {
        remoteFiles = [];
        let files = data.split('<br>');
        for(let file of files) {
          if(file !== "") {
            remoteFiles.push(file);
          }
        }
        resolve();
      });
    });
  }

  async downloadFiles() {
    return new Promise(resolve => {
      let i = 0;
      let l = filesToDownload.length;
      this.client.emit("debug", "[EMC]: Downloading files (" + l + ")");
      if(l == 0) {
        resolve();
      }
      for(let file of filesToDownload) {
        if(file !== "") {
          this.downloadFile(file).then(data => {
            i++;
            if(i >= l) {
              resolve();
            }
          });   
        }else {
          i++;
          if(i >= l) {
            resolve();
          }
        }
      }
    });
  }

  parseRule (lib) {
    if (lib.rules) {
      if (lib.rules.length > 1) {
        if (lib.rules[0].action === 'allow' &&
                    lib.rules[1].action === 'disallow' &&
                    lib.rules[1].os.name === 'osx') {
          return this.getOS() === 'osx'
        } else {
          return true
        }
      } else {
        if (lib.rules[0].action === 'allow' && lib.rules[0].os) return this.getOS() !== 'osx'
      }
    } else {
      return false
    }
  }

  async getNatives () {
    const nativeDirectory = path.resolve(path.join(this.options.root, 'natives', this.version.id))

    this.client.emit('debug', `[EMC]: Set native path to ${nativeDirectory}`)

    return nativeDirectory
  }

  fwAddArgs () {
    const forgeWrapperAgrs = [
      `-Dforgewrapper.librariesDir=${path.resolve(this.options.overrides.libraryRoot || path.join(this.options.root, 'libraries'))}`,
      `-Dforgewrapper.installer=${this.options.forge}`,
      `-Dforgewrapper.minecraft=${this.options.mcPath}`
    ]
    this.options.customArgs
      ? this.options.customArgs = this.options.customArgs.concat(forgeWrapperAgrs)
      : this.options.customArgs = forgeWrapperAgrs
  }

  isModernForge (json) {
    return json.inheritsFrom && json.inheritsFrom.split('.')[1] >= 12 && !(json.inheritsFrom === '1.12.2' && (json.id.split('.')[json.id.split('.').length - 1]) === '2847')
  }

  async getForgedWrapped () {
    let json = null
    let installerJson = null
    const versionPath = path.join(this.options.root, 'versions', `${this.version.id}`, this.version.id + '.json')
    // Since we're building a proper "custom" JSON that will work nativly with EMC, the version JSON will not
    // be re-generated on the next run.
    if (fs.existsSync(versionPath)) {
      try {
        json = JSON.parse(fs.readFileSync(versionPath))
        if (!json.forgeWrapperVersion || !(json.forgeWrapperVersion === this.options.fw.version)) {
          this.client.emit('debug', '[EMC]: Old ForgeWrapper has generated this version JSON, re-generating')
        } else {
          // If forge is modern, add ForgeWrappers launch arguments and set forge to null so EMC treats it as a custom json.
          if (this.isModernForge(json)) {
            this.fwAddArgs()
            this.options.forge = null
          }
          return json
        }
      } catch (e) {
        console.warn(e)
        this.client.emit('debug', '[EMC]: Failed to parse Forge version JSON, re-generating')
      }
    }

    this.client.emit('debug', '[EMC]: Generating a proper version json, this might take a bit')
    json = fs.readFileSync(path.join(this.options.root, 'versions', `${this.options.forge}`, this.options.forge + '.json'))

    try {
      json = JSON.parse(json)
    } catch (e) {
      this.client.emit('debug', '[EMC]: Failed to load json files for ForgeWrapper, using Vanilla instead')
      return null
    }

    if (this.isModernForge(json)) {
      if (json.inheritsFrom !== '1.12.2') {
        this.fwAddArgs()
      }
    }
        
    if (this.isModernForge(json)) this.options.forge = null

    return json
  }

  async downloadToDirectory (directory, libraries, eventName) {
    const libs = []

    await Promise.all(libraries.map(async library => {
      if (!library) return
      const lib = library.name.split(':')

      let jarPath
      let name
      if (library.downloads && library.downloads.artifact && library.downloads.artifact.path) {
        name = library.downloads.artifact.path.split('/')[library.downloads.artifact.path.split('/').length - 1]
        jarPath = path.join(directory, this.popString(library.downloads.artifact.path))
      } else {
        name = `${lib[1]}-${lib[2]}${lib[3] ? '-' + lib[3] : ''}.jar`
        jarPath = path.join(directory, `${lib[0].replace(/\./g, '/')}/${lib[1]}/${lib[2]}`)
      }

      libs.push(`${jarPath}${path.sep}${name}`)
    }))
    counter = 0

    return libs
  }

  async getClasses (classJson) {
    let libs = []

    const libraryDirectory = path.resolve(this.options.overrides.libraryRoot || path.join(this.options.root, 'libraries'))

    if (classJson) {
      if (classJson.mavenFiles) {
        await this.downloadToDirectory(libraryDirectory, classJson.mavenFiles, 'classes-maven-custom')
      }
      libs = (await this.downloadToDirectory(libraryDirectory, classJson.libraries, 'classes-custom'))
    }

    const parsed = this.version.libraries.map(lib => {
      if (lib.downloads && lib.downloads.artifact && !this.parseRule(lib)) return lib
    })

    libs = libs.concat((await this.downloadToDirectory(libraryDirectory, parsed, 'classes')))
    counter = 0

    this.client.emit('debug', '[EMC]: Collected class paths')
    return libs
  }

  popString (path) {
    const tempArray = path.split('/')
    tempArray.pop()
    return tempArray.join('/')
  }

  cleanUp (array) {
    const newArray = []
    for (const classPath in array) {
      if (newArray.includes(array[classPath]) || array[classPath] === null) continue
      newArray.push(array[classPath])
    }
    return newArray
  }

  async getLaunchOptions (modification) {
    const type = modification || this.version

    let args = type.minecraftArguments
      ? type.minecraftArguments.split(' ')
      : type.arguments.game
    const assetRoot = path.resolve(this.options.overrides.assetRoot || path.join(this.options.root, 'assets'))
    const assetPath = this.isLegacy()
      ? path.join(this.options.root, 'resources')
      : path.join(assetRoot)

    const minArgs = this.options.overrides.minArgs || this.isLegacy() ? 5 : 11
    if (args.length < minArgs) args = args.concat(this.version.minecraftArguments ? this.version.minecraftArguments.split(' ') : this.version.arguments.game)

    this.options.authorization = await Promise.resolve(this.options.authorization)

    const fields = {
      '${auth_access_token}': this.options.authorization.access_token,
      '${auth_session}': this.options.authorization.access_token,
      '${auth_player_name}': this.options.authorization.name,
      '${auth_uuid}': this.options.authorization.uuid,
      '${user_properties}': this.options.authorization.user_properties,
      '${user_type}': 'mojang',
      '${version_name}': this.options.version,
      '${assets_index_name}': this.version.assetIndex.id,
      '${game_directory}': this.options.root,
      '${assets_root}': assetPath,
      '${game_assets}': assetPath,
      '${version_type}': 'release'
    }

    for (let index = 0; index < args.length; index++) {
      if (typeof args[index] === 'object') args.splice(index, 2)
      if (Object.keys(fields).includes(args[index])) {
        args[index] = fields[args[index]]
      }
    }

    if (this.options.window) {
      this.options.window.fullscreen
        ? args.push('--fullscreen')
        : args.push('--width', this.options.window.width, '--height', this.options.window.height)
    }
    if (this.options.server) args.push('--server', this.options.server.host, '--port', this.options.server.port || '25565')
    if (this.options.proxy) {
      args.push(
        '--proxyHost',
        this.options.proxy.host,
        '--proxyPort',
        this.options.proxy.port || '8080',
        '--proxyUser',
        this.options.proxy.username,
        '--proxyPass',
        this.options.proxy.password
      )
    }
    if (this.options.customLaunchArgs) args = args.concat(this.options.customLaunchArgs)
    this.client.emit('debug', '[EMC]: Set launch options')
    return args
  }

  async getJVM () {
    const opts = {
      windows: '-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump',
      osx: '-XstartOnFirstThread',
      linux: '-Xss1M'
    }
    return opts[this.getOS()]
  }

  isLegacy () {
    return this.version.assets === 'legacy' || this.version.assets === 'pre-1.6'
  }

  getOS () {
    if (this.options.os) {
      return this.options.os
    } else {
      switch (process.platform) {
        case 'win32': return 'windows'
        case 'darwin': return 'osx'
        default: return 'linux'
      }
    }
  }

  // To prevent launchers from breaking when they update. Will be reworked with rewrite.
  getMemory () {
    if (!this.options.memory) {
      this.client.emit('debug', '[EMC]: Memory not set! Setting 1GB as MAX!')
      this.options.memory = {
        min: 512,
        max: 1023
      }
    }
    if (!isNaN(this.options.memory.max) && !isNaN(this.options.memory.min)) {
      if (this.options.memory.max < this.options.memory.min) {
        this.client.emit('debug', '[EMC]: MIN memory is higher then MAX! Resetting!')
        this.options.memory.max = 1023
        this.options.memory.min = 512
      }
      return [`${this.options.memory.max}M`, `${this.options.memory.min}M`]
    } else { return [`${this.options.memory.max}`, `${this.options.memory.min}`] }
  }
}

module.exports = Handler