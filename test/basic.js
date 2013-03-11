var test = require('tap').test
  , splitter = require('splitter')
  , tub = require('../')
  , stream = require('stream')
  , inherits = require('util').inherits;


// basic read stream that will emit data given
function Pumper(data) {
  stream.Readable.call(this, {});
  this.data = data;
}
inherits(Pumper, stream.Readable);

Pumper.prototype._read = function (size) {
  if (!this.data.length) {
    this.push(null);
    return null;
  }
  var out = this.data.slice(0, size);
  this.push(out);
  this.data = this.data.slice(size);
  return out.length;
};


test("2x pass", function (t) {
  t.plan(3);

  var buff = "1..2\nok 1 first pass\nTAP version 13\nok 2 snd pass";
  var pump = new Pumper(buff);
  var onFinish = function (res) {
    t.equal(res.asserts.length, 2, "should find 2 asserts");
    t.equal(res.failed.length, 0, "should be 0 fails");
    t.ok(res.ok, "this should be a pass");
  };
  pump.pipe(splitter()).pipe(tub(onFinish));
});

test("1 pass 1 fail", function (t) {
  t.plan(3);

  var buff = "1..2\nok 1 first pass\n# comment\nnot ok 2 snd pass";
  var pump = new Pumper(buff);
  var onFinish = function (res) {
    t.equal(res.asserts.length, 2, "should find 2 asserts");
    t.equal(res.failed.length, 1, "should be 1 fail");
    t.ok(!res.ok, "this should be a fail");
  };
  pump.pipe(splitter()).pipe(tub(onFinish));
});

test("2x pass no numbers", function (t) {
  t.plan(3);

  var buff = "1..2\nok first pass\nok snd pass";
  var pump = new Pumper(buff);
  var onFinish = function (res) {
    t.equal(res.asserts.length, 2, "should find 2 asserts");
    t.equal(res.failed.length, 0, "should be 0 fails");
    t.ok(res.ok, "this should be a pass");
  };
  pump.pipe(splitter()).pipe(tub(onFinish));
});

test("2x pass no, but plan longer", function (t) {
  t.plan(3);

  var buff = "1..3\nok first pass\nok snd pass";
  var pump = new Pumper(buff);
  var onFinish = function (res) {
    t.equal(res.asserts.length, 2, "should find 2 asserts");
    t.equal(res.failed.length, 0, "should be 0 fails");
    t.ok(!res.ok, "this should not be a pass, missing one assert");
  };
  pump.pipe(splitter()).pipe(tub(onFinish));
});

test("1x pass, then bail", function (t) {
  t.plan(6);
  var buff = "1..2\nok first pass\nBail out! something fubar";
  var pump = new Pumper(buff);
  var onFinish = function (res) {
    t.equal(res.plan.start, 1, "plan starts at 1");
    t.equal(res.plan.end, 2, "plan ends at 2");
    t.equal(res.asserts.length, 1, "should find 1 asserts");
    t.equal(res.failed.length, 0, "should be 0 fails");
    t.ok(res.summary.indexOf('something fubar') >= 0, 'bailout string in summary');
    t.ok(!res.ok, "this should not be a pass, bailed out");
  };
  pump.pipe(splitter()).pipe(tub(onFinish));
});
