const { Client, Authenticator } = require('minecraft-launcher-core');
const launcher = new Client();

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
    console.log("Usage: node builder/main.js --version=@version --path=@path");
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

launcher.launch(opts);

launcher.on('debug', (e) => {
   if(e.includes("Set launch options")) {
       
   }
});