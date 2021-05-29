const { Client, Authenticator } = require('minecraft-launcher-core');
const launcher = new Client();

const AdmZip = require('adm-zip');

let version = null;
let path = null;

process.argv.forEach(function (val, index, array) {
    if(val.startsWith('--version') || val.startsWith('--v')) {
        version = val.split('=')[1];
    }else if(val.startsWith('--path') || val.startsWith('--p')) {
        path = val.split('=')[1];
    }
});

console.log("Version: " + version);
console.log("Path: " + path);

if(version == null || path == null) {
    console.log("Usage: node utils/builder.js --version=@version --path=@path");
    return;
}

let opts = {
    clientPackage: null,
    authorization: Authenticator.getAuth("EMC-Core-Builder", ""),
    root: path + "/" + version,
    version: {
        number: version,
        type: "release"
    },
    memory: {
        max: "6G",
        min: "4G"
    }
}

let mc = launcher.launch(opts);

launcher.on('debug', (e) => {
   console.log(e);
});

launcher.on('close', (e) => {
    let p = path + "/" + version;
    console.log("end downloading file, Starting building archive");

    let zip = new AdmZip()
    zip.addLocalFolder("./EMC-Core-Server/java", "java")
    zip.addLocalFile("./EMC-Core-Server/reader.php")
    zip.addLocalFolder(p + "/assets", "files/assets")
    zip.addLocalFolder(p + "/libraries", "files/libraries")
    zip.addLocalFolder(p + "/natives", "files/natives")
    zip.addLocalFolder(p + "/versions", "files/versions")

    zip.writeZip(p + "/EMC-Core-Server.zip")
});