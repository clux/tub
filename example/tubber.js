#!/usr/bin/env node
var tub = require('../');
var splitter = require('splitter');
var onFinish = function (res) {
  console.log(res);
  process.exit(res.ok ? 0 : 1);
};
process.stdin
  .pipe(splitter())
  .pipe(tub(onFinish));
