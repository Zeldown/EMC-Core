'use strict'

var test = require('tap').test
  , spawn = require('child_process').spawn
  , path = require('path')
  , fixtures = path.join(__dirname, 'fixtures')

test('no options works', function(t) {
  t.plan(1)
  var fp = path.join(fixtures, 'default', 'index.js')
  var child = spawn(process.execPath, [fp])
  var res = ''
  child.stdout.on('data', function(chunk) {
    res += chunk
  })

  child.stderr.on('data', function(chunk) {
    t.ok(false, chunk)
  })

  child.on('close', function() {
    res = res.replace('\n', '').trim()
    t.equal(res, 'USAGE')
    t.end()
  })
})

test('passing file works', function(t) {
  t.plan(1)
  var fp = path.join(fixtures, 'default', 'index.js')
  var f = path.join(fixtures, 'default', 'usage2.txt')
  var child = spawn(process.execPath, [fp, f])
  var res = ''
  child.stdout.on('data', function(chunk) {
    res += chunk
  })

  child.stderr.on('data', function(chunk) {
    t.ok(false, chunk)
  })

  child.on('close', function() {
    res = res.replace('\n', '').trim()
    t.equal(res, 'USAGE2')
  })
})

test('passing file and exit code works', function(t) {
  t.plan(2)
  var fp = path.join(fixtures, 'default', 'index.js')
  var f = path.join(fixtures, 'default', 'usage2.txt')
  var child = spawn(process.execPath, [fp, f, 12])
  var res = ''
  child.stdout.on('data', function(chunk) {
    res += chunk
  })

  child.stderr.on('data', function(chunk) {
    t.ok(false, chunk)
  })

  child.on('close', function(code) {
    t.equal(code, 12)
    res = res.replace('\n', '').trim()
    t.equal(res, 'USAGE2')
  })
})
