#!/usr/bin/env node
var tub = require('./')
  , splitter = require('splitter')
  , devNull = require('dev-null')
  , cp = require('child_process')
  , argv = require('minimist')(process.argv.slice(2));

if (argv.h || argv.help) {
  console.log('tapsource | tub [-a]');
  process.exit(0);
}

var onEnd = function (err, res) {
  console.log(res.ok ? '✓' : '✗', res.summary);
  res.failed.forEach(function (a) {
    console.log('%s%s', a.number !== undefined ? a.number + ' ' : '', a.name);
    if (a.info.length > 0) {
      console.log(a.info.join('\n'));
    }
  });
  process.exit(res.ok ? 0 : 1);
};

process.stdin.pipe(splitter())
  .pipe(tub(onEnd))
  .pipe(argv.a || argv.all ? process.stdout : devNull());
