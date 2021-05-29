# EMC-Core
NodeJS Module for Electron Minecraft launcher

## Avantages :dizzy:
**EMC-Core** is a upgrade of [minecraft-launcher-core](https://www.npmjs.com/package/minecraft-launcher-core) *dev by Pierce01*

- Auto check & downloading compatible java version
- Support 100% custom minecraft version
- Work with ftp without any zip file, juste drop folder in your ftp
- Auto check & delete file with bad hash & size

# Install Client

## Quick Start :zap:
```npm
git clone https://github.com/Zeldown/EMC-Core-quick-start.git
cd EMC-Core-quick-start
npm install
npm start
```

## Installation :package:
```npm
npm install emc-core
```

## Usage :triangular_flag_on_post:
Require library
```javascript
const { MCAuth, MCLaunch } = require('emc-core');
```

Create and Init launcher var [MCLaunch](utils/launcher.js)
```javascript
const launcher = new MCLaunch();
```

## Authentification :lock:
#### Mojang

```javascript
let authenticator;

MCAuth.auth(username, password).then(user => {
  authenticator = user;
  //success
}).catch(error => {
  //error
})
```
> username => The email of mojang account

> password => The password of mojang account

Return 
```javascript
const user = {
  access_token: uuid(),
  client_token: uuid(),
  uuid: uuid(),
  name: username,
  user_properties: JSON.stringify({})
}
```
___
#### Microsoft
**InDev**

## Launch :rocket:
### Options
```javascript
let opts = {
  url: "http://zeldown.com/emc-core/",
  overrides: {
    detached: false
  },
  authorization: authenticator,
  root: "C:/Users/guill/AppData/Roaming/.emc-core",
  version: "1.15.2",
  forge: "1.15.2-forge-31.2.0",
  checkFiles: true,
  memory: {
      max: "6G",
      min: "4G"
  }
}
```
Option | Type | Description | Required
--- | --- | --- | ---
url | `String` | *Url of files to download* | **true**
authorization | `Authentificator` | *The authentificator variable get when MCAuto* | **true**
root | `String` | *The path to minecraft directory* | **true**
version | `String` | *The version of minecraft* | **true**
checkFiles | `Boolean` | *Check or not file to delete* | **true**
forge | `String` | *The name of used forge* | **false**
memory | `Array` | *The informations of memory, contains* **max** *and* **min** | **false**

### Launching
```javascript
launcher.launch(opts);
```` 

## Debugging :bug:
To get debug use `launcher.on('xxx', (e) => ...)`

> debug

call when a **debug** log is print by Minecraft
```javascript
launcher.on('debug', (e) => console.log("[DEBUG]" + e));
```

> data

call when a **data** log is print by Minecraft
```javascript
launcher.on('data', (e) => console.log("[DATA]" + e));
```

> error

call when a **error** log is print by Minecraft
```javascript
launcher.on('error', (e) => console.log("[ERROR]" + e));
```

> download-status

call when a **download file** progress
```javascript
launcher.on('download-status', (e) => {
  //update progress bar
});
```
Name | Type | Description
--- | --- | ---
name | `String` | The name of current file is downloading
type | `String` | The type of file (assets, natives, java, mods, ...)
currentDownloadedBytes | `int` | The count of bytes downloaded of file
currentBytesToDownload | `int` | The count of bytes to download of file
downloadedBytes | `int` | The count of bytes downloaded of folder
bytesToDownload | `int` | The count of bytes to download of folder
downloadFiles | `int` | The count of file downloaded of folder
filesToDownload | `int` | The count of file to download of folder

> verification-status

call when a **verification of files** progress
```javascript
launcher.on('verification-status', (e) => {
  //update verification bar
});
```
Name | Type | Description
--- | --- | ---
name | `String` | The url of verified file
current | `int` | The count of files checked
total | `int` | The count of files to check

> launch

call when Minecraft **start launching**
```javascript
launcher.on('launch', (e) => {
  //Minecraft start
});
```

___
# Install Server :construction:
> :rotating_light: You must have a web hosting

## PreBuild Server Version
1. Download **EMC-Core-Server** of your version at *https://github.com/Zeldown/EMC-Core/releases*
2. Extract archive on your computer
3. In *EMC-Core-Server/files* put your files to download (mods, config, etc). Default files in folder is **mandatory** (assets, libraries, natives, versions)
4. Put the folder *EMC-Core-Server* to your web hosting (exemple: upload folder EMC-Core-Server at https://exemple.com/)
5. Set url option of *launch options* to url of content of *EMC-Core-Server* (exemple: https://exemple.com/EMC-Core-Server)
```javascript
let opts = {
  url: url_of_emc-core-server,
  ...
}
```

## Build EMC-Core-Server with builder.js
1. Clone **EMC-Core project** at *https://github.com/Zeldown/EMC-Core*
2. Extract archive on your computer
3. Go into emc-core extracted folder
4. run ``npm i``
5. run ``node utils/builder.js --version="@version" --path="@path"``

Name | Type | Description
--- | --- | ---
@version | `String` | The name of minecraft vanilla version (e.g. 1.15.2)
@path | `String` | The full path where build will be created (path must be exists)

## Build custom EMC-Core-Server
1. Create a folder with the file [reader.php](EMC-Core-Server/reader.php)
2. Create a folder **java**
3. Put an archive of java named *java.zip* in ```java``` folder (exemple : [java.zip](EMC-Core-Server/java/java.zip)
4. Create a folder **files**
5. Put all files of minecraft in folder ```files``` like *assets, library, natives, mods, versions*
6. Put your custom folder to your web hosting (exemple: upload folder My-Version at https://exemple.com/)
7. Set url option of *launch options* to url of content of *custom folder* (exemple: https://exemple.com/My-Version)
```javascript
let opts = {
  url: url_of_your_uploaded_version,
  ...
}
```

## Credits :tada:
Based on code of **Pierce01** :heart:

Special thanks to **Faustin#8347** for code help & readme review

Thanks to **Relax#3333** for funding
