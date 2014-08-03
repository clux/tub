# tub
[![npm status](http://img.shields.io/npm/v/tub.svg)](https://www.npmjs.org/package/tub)
[![build status](https://secure.travis-ci.org/clux/tub.svg)](http://travis-ci.org/clux/tub)
[![dependency status](https://david-dm.org/clux/tub.svg)](https://david-dm.org/clux/tub)
[![coverage status](http://img.shields.io/coveralls/clux/tub.svg)](https://coveralls.io/r/clux/tub)
[![unstable](http://img.shields.io/badge/stability-unstable-E5AE13.svg)](http://nodejs.org/api/documentation.html#documentation_stability_index)

Tub is a streaming tap parser that serves two purposes.

- It's a writable stream that collects and determines the end result of the tests output. It collects assert results, failed asserts, and creates a summary string, and an `ok` bool to be able to determine easily from a callback what happened.

- When piped to, the result is a readable stream, in that it provides a shorter, comment free output that can be piped to stdout for information as the tests are running.

It's based on streams2, and inherits from `stream.Transform` to accomplish this, so you will need node >= 0.10.

## Options
The tap parser itself is a little more relaxed than most tap parsers, in that numbers does not need to exist in the tap output, as long as the amount of tests add up to what's in the plan. It also deals with the `Bail out!` statement.

It will also ignore lines it cannot parse as valid TAP by default. To throw on such error pass a `{strict:true}`
option.

## Usage 1
Create your own customized results logger for command line use:

```js
// tubber.js
var tub = require('tub');
var splitter = require('splitter');
var fullOutput = Boolean(process.argv[2]);
var onFinish = function (res) {
  console.log(res);
  process.exit(res.ok ? 0 : 1)
};
process.stdin
  .pipe(splitter())
  .pipe(tub(onFinish))
  .pipe(fullOutput ? process.stdout : devNull()); // always need to read from tub
```

then hook into some raw tap output (perhaps from the `tap` module) and hand it over to your script!

```bash
$ tap test/*.js --tap | node tubber.js
```

which would give you the raw output like the following

```
{ plan: { start: 1, end: 5 },
  asserts:
   [ { ok: true, number: 1, name: 'upvotes good', info: [] },
     { ok: true, number: 2, name: 'downvotes bad', info: [] },
     { ok: true,
       number: 3,
       name: 'higher confidence means lowers bounds',
       info: [] },
     { ok: false,
       number: 4,
       name: 'this will fail deliberately',
       info: [Object] },
     { ok: true, number: 5, name: 'upvotes good', info: [] } ],
  version: 13,
  failed:
   [ { ok: false,
       number: 4,
       name: 'this will fail deliberately',
       info: [Object] } ],
  ok: false,
  summary: '1 / 5 assertions failed' }
```

Note that the failed asserts gets copied to the failed list. When using output from `tap`, every failed test will have an info list which can be joined to produce the normal stack trace that normally accompanies them:

```js
// add this line to `onFinish`
console.log(res.failed[0].info.join('\n'));
```

which will give the following extra output:

```
  ---
    file:   /home/clux/repos/decay/test/all.js
    line:   22
    column: 5
    stack:
      - getCaller (/home/clux/local/node/lib/node_modules/tap/lib/tap-assert.js:418:17)
      - Function.assert (/home/clux/local/node/lib/node_modules/tap/lib/tap-assert.js:21:16)
      - Test._testAssert [as ok] (/home/clux/local/node/lib/node_modules/tap/lib/tap-test.js:86:16)
      - Test.<anonymous> (/home/clux/repos/decay/test/all.js:22:5)
      - Test.EventEmitter.emit (events.js:117:20)
      - Test.emit (/home/clux/local/node/lib/node_modules/tap/lib/tap-test.js:103:8)
      - GlobalHarness.Harness.process (/home/clux/local/node/lib/node_modules/tap/lib/tap-harness.js:86:13)
      - process._tickCallback (node.js:415:13)
      - Function.Module.runMain (module.js:499:11)
      - startup (node.js:119:16)
  ...
```

But `info` can be set on any assert. It's just indented output belonging to the previous assertion.

## Usage 2
Use `tub` as a library and pipe tap test runner data to the tub stream.
Alternatively, any raw TAP output data could be read from a log and piped to `tub` via `splitter`. Personal use of this involves parsing TAP output generated from C++.

```js
fs.createReadStream('./tapLog.txt')
  .pipe(splitter())
  .pipe(tub(onEnd))
  .pipe(fullOutput ? process.stdout : devNull());
```

Obviously, if you use node's `child_process` module, you don't have to wait for the log to be written, but just pipe the spawned child directly!

## Usage 3
Use the bundled bin file that can be used in place of `tap`:

```bash
$ npm install -g tub
$ tub test/*.js
✗ 1 / 61 assertions failed
7 name of failed test
  ---
    file:   /home/clux/repos/failedTestRepo/test.js
    stack:  stack trace lines would follow here
  ...
```

Any arguments passed to `tub` is passed directly through to `tap`, with the sole exception of `-a` or `--all`, which causes the output from `tub` to be additionally piped to `process.stdout` to provide go-along feedback as the tests run:

```
$ tub test/*.js --all
✓ 1 1-dim identity
✓ 2 noop
✓ 3 constant
✓ 4 !false
✓ 5 range/elem filter
✓ 6 range/elem filter
✗ 7 woot
  ---
    file:   /home/clux/repos/failedTestRepo/test.js
    stack:  stack trace lines would follow here
  ...
✓ 8 primes 5,3 are coprime
✓ 9 21 and 14 have 7 as gcd
...
more tests
...
1..61
✗ 1 / 61 assertions failed
✗ 7 woot
  ---
    file:   /home/clux/repos/failedTestRepo/test.js
    stack:  stack trace lines would follow here
  ...
```

Note that using `tub` requires the module you are testing it on to have `tap` installed, the bin file is a convenience, not the main thing here.

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
