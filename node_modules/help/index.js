'use strict'

const path = require('path')
const fs = require('fs')

module.exports = function(file, stream) {
  stream = stream || process.stdout
  file = file
    ? file
    : module.parent && module.parent.filename
    ? path.resolve(path.dirname(module.parent.filename), 'usage.txt')
    : path.resolve('usage.txt')

  return function(code) {
    const rs = fs.createReadStream(file)
    rs.pipe(stream)
    if (code) {
      rs.on('close', function() {
        process.exitCode = code
      })
    }
  }
}
