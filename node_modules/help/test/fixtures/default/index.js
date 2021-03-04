'use strict'

var help = require('../../../')
var args = process.argv.splice(2)
var file = args[0] || undefined
var exitCode = args[1] || 0

if (file && exitCode) {
  return help(file)(exitCode)
}

if (file) {
  return help(file)()
}

if (exitCode) {
  return help()(exitCode)
}

return help()()
