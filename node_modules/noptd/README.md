# noptd

[![Build Status](https://travis-ci.org/evanlucas/noptd.svg)](https://travis-ci.org/evanlucas/noptd)
[![Coverage Status](https://coveralls.io/repos/evanlucas/noptd/badge.svg?branch=master&service=github)](https://coveralls.io/github/evanlucas/noptd?branch=master)

nopt with default values

*Note: noptd is only supported on iojs and node v4+. To use with an older
version of node, please use `noptd@1`.*

## Install

```bash
$ npm install --save noptd
```

## Example

```js
// test.js
var nopt = require('noptd')
var shortHand = { help: Boolean, name: String }
var defaults = { name: 'evan' }
var parsed = nopt(shortHand, null)(defaults)
console.log(parsed.name)
```

Then run with node

```bash
$ node test.js
// => 'evan'
```

Or try passing in a name

```bash
$ node test --name test
// => 'test'
```


## Author

Evan Lucas

## License

MIT (See `LICENSE` for more info)
