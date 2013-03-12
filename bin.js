#!/usr/bin/env node
var tub = require('./')
  , splitter = require('splitter')
  , cp = require('child_process');

var onFinish = function (res) {
  console.log('%s %s', res.ok ? '✓' : '✗', res.summary);
  res.failed.forEach(function (a) {
    console.log('%s%s', a.number !== undefined ? a.number + ' ' : '', a.name);
    if (a.info.length > 0) {
      console.log(a.info.join('\n'));
    }
  });
  process.exit(res.ok ? 0 : 1);
};

// simple extra argv option (-a or --all) that doesnt get passed through to `tap`
var argv = process.argv.slice(2);
var readTub = (argv.indexOf('-a') >= 0 || argv.indexOf('--all') >= 0);

var tapArgs = argv.filter(function (a) {
  return (a !== '-a' && a !== '--all');
}).concat('--tap');

var child = cp.spawn('tap', tapArgs, {stdio: 'pipe'});
var tubStream = child.stdout.pipe(splitter()).pipe(tub(onFinish));

if (readTub) {
  tubStream.pipe(process.stdout);
}
