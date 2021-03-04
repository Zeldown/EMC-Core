'use strict'

const nopt = require('nopt')

module.exports = function(known, sh, argv, slice) {
  return function(def) {
    const parsed = nopt(known, sh, argv, slice)
    if (!def || typeof def !== 'object') {
      return parsed
    }
    const keys = Object.keys(def)
    for (var i = 0, len = keys.length; i < len; i++) {
      const key = keys[i]
      if (!parsed.hasOwnProperty(key)) {
        parsed[key] = def[key]
      }
    }

    return parsed
  }
}
