'use strict'

const nopt = require('./')
    , test = require('tap').test

test('should work without defaults', function(t) {
  t.plan(1)
  const input = ['--help']
  const parsed = nopt({
    help: Boolean
  , name: String
  }, null, input, 0)()
  t.equal(parsed.help, true)
})

test('should work with defaults', function(t) {
  t.plan(4)
  const input = ['--help']
  const parsed = nopt({
    help: Boolean
  , name: String
  }, null, input, 0)({
    name: 'evan'
  })
  t.equal(parsed.help, true)
  t.equal(parsed.name, 'evan')

  const input2 = ['--help', '--name', 'name']
  const parsed2 = nopt({
    help: Boolean
  , name: String
  }, null, input2, 0)({
    name: 'evan'
  })
  t.equal(parsed2.help, true)
  t.equal(parsed2.name, 'name')
})
