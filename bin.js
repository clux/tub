#!/usr/bin/env node
var tub = require('./')
  , splitter = require('splitter')
  , devNull = require('dev-null')
  , cp = require('child_process');

// simple extra argv option (-a or --all) that doesnt get passed through to `tap`
var argv = process.argv.slice(2);
var readTub = (argv.indexOf('-a') >= 0 || argv.indexOf('--all') >= 0);

var tapArgs = argv.filter(function (a) {
  return (a !== '-a' && a !== '--all');
}).concat('--tap');

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

var pth = require('path').join(__dirname, 'node_modules', '.bin', 'tap');
cp.spawn(pth, tapArgs, {stdio: 'pipe', cwd: process.cwd() })
  .stdout
  .pipe(splitter())
  .pipe(tub(onEnd))
  .pipe(readTub ? process.stdout : devNull());
