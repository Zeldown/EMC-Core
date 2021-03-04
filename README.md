# EMC-Core
NodeJS Module for Electron Minecraft launcher

## Installation
```npm
npm install emc-core
```

## Usage
Require library
```javascript
const { MCAuth, MCLaunch } = require('emc-core');
```

Create and Init launcher var [MCLaunch](utils/launcher.js)
```javascript
const launcher = new MCLaunch();
```

### Authentification
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

## Launch
### Options
```javascript
let opts = {
  url: "http://zeldown.com/emc-core/",
  overrides: {
    detached: false
  },
  authorization: authenticator,
  root: "C:/Users/guill/AppData/Roaming/.worldclient",
  version: "1.15.2",
  forge: "1.15.2-forge-31.2.0",
  memory: {
      max: "6G",
      min: "4G"
  }
}
```
Option | Type | Description | Optional
--- | --- | --- | ---
url | `String` | *Url of files to download* | **true**
authorization | `Authentificator` | *The authentificator variable get when MCAuto* | **false**
root | `String` | *The path to minecraft directory* | **false**
version | `String` | *The version of minecraft* | **false**
forge | `String` | *The name of used forge* | **true**
memory | `Array` | *The informations of memory, contains* **max** *and* **min** | **true**

### Launching
```javascript
launcher.launch(opts);
```` 

### Debugging
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
