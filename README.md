# Tub [![Build Status](https://secure.travis-ci.org/clux/tub.png)](http://travis-ci.org/clux/tub)

Tub is a streaming tap parser that serves two purposes. It's a writable stream that collects and determines the end result, fails, summary from what's sent to it. But it's also a readable stream, in that it provides an optional shorter, comment free output that can be piped to stdout for information as the tests are running.

Because it's based on streams2, it inherits from stream.Transform to do this, and you will need node >= 0.10.

## Usage 1
For programmatical use, install `tub` in the normal (non-global) way, then give it some data and an `onFinish` function.

```js
var tub = require('tub');
var splitter = require('splitter')
var onFinish = function (res) {
  console.log('\n\nParsed TAP v%s', res.version || 'X');
  console.log('%s %s', res.ok ? '✓' : '✗', res.summary);
  res.failed.forEach(function (a) {
    console.log('%s%s', a.number !== undefined ? a.number + ' ' : '', a.name);
    if (a.info.length > 0) {
      // failed asserts usually have stack traces or other info attached to them
      console.log(a.info.join('\n'));
    }
  });
  process.exit(res.ok ? 0 : 1)
};
process.stdin
  .pipe(splitter())
  .pipe(tub(onFinish))
  .pipe(process.stdout);
```

and replace the `onFinish` function with something of your choice, and perhaps ignore the readable output from `tub()`. To use it programmatically on a particular test file, rather than `process.stdin` from tap test/file.js --tap, start out reading the file then pipe it to a test runner from `tap`.

## Usage 2
If you want the behaviour above as a command line tool, you can install tub globally, and use the new `tub` executable:

```bash
$ npm install -g tub
$ tub test/*.js
```

This usage is currently not available properly and in development.

## Running tests
Install development dependencies

```bash
$ npm install
```

Run the tests

```bash
$ npm test
```

## License
MIT-Licensed. See LICENSE file for details.
