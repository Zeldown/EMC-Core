const { Authenticator } = require('minecraft-launcher-core');

module.exports.auth = function(username, password) {
  return new Promise((resolve, reject) => {
    Authenticator.getAuth(username, password).then(user => {
      return resolve(user);
    }).catch(error => {
      return reject(error);
    })
  })
}