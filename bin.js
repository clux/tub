#!/usr/bin/env node
var tub = require('./')
  , splitter = require('splitter')
  , cp = require('child_process');

// simple extra argv option (-a or --all) that doesnt get passed through to `tap`
var argv = process.argv.slice(2);
var readTub = false;
var allIdx1 = argv.indexOf('-a');
var allIdx2 = argv.indexOf('--all');
if (allIdx1 >= 0 || allIdx2 >= 0) {
  readTub = true;
  if (allIdx1 >= 0) {
    argv.splice(allIdx1, 1);
  }
  if (allIdx2 >= 0) {
    argv.splice(allIdx2, 1);
  }
}

var onFinish = function (res) {
  console.log('%s %s', res.ok ? '✓' : '✗', res.summary);
  if (res.failed.length > 0) {
    res.failed.forEach(function (a) {
      console.log('%s%s', a.number !== undefined ? a.number + ' ' : '', a.name);
      if (a.info.length > 0) {
        console.log(a.info.join('\n'));
      }
    });
  }
  process.exit(res.ok ? 0 : 1);
};

// all other args are passed through to `tap`, along with --tap
var child = cp.spawn('tap', argv.concat('--tap'), {stdio: 'pipe'});
var tubStream = child.stdout.pipe(splitter()).pipe(tub(onFinish));

if (readTub) {
  tubStream.pipe(process.stdout);
}
