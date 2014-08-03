var splitter = require('splitter')
  , tub = require(process.env.TUB_COV ? '../tub-cov.js' : '../')
  , stream = require('stream');

// basic read stream that will emit data given
function Pumper(data) {
  stream.Readable.call(this, {});
  this.data = data;
}
Pumper.prototype = Object.create(stream.Readable.prototype);

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


exports.twoPass = function (t) {
  var buff = "1..2\nok 1 first pass\nTAP version 13\nok 2 snd pass";
  var pump = new Pumper(buff);
  var onFinish = function (res) {
    t.equal(res.asserts.length, 2, "should find 2 asserts");
    t.equal(res.asserts[0].name, "first pass", "first pass name");
    t.equal(res.asserts[0].number, 1, "first pass number");
    t.ok(res.asserts[0].ok, "first pass");
    t.equal(res.asserts[1].name, "snd pass", "snd pass name");
    t.equal(res.asserts[1].number, 2, "snd pass number");
    t.ok(res.asserts[1].ok, "2nd pass");
    t.equal(res.failed.length, 0, "should be 0 fails");
    t.ok(res.ok, "this should be a pass");
    t.done();
  };
  pump.pipe(splitter()).pipe(tub(onFinish));
};

exports.twoPassOneFail = function (t) {
  var buff = "1..3\nok 1 first pass\n# comment\nnot ok 2 snd failed\n  STACK\nok 3 woo";
  var pump = new Pumper(buff);
  var onFinish = function (res) {
    t.equal(res.asserts.length, 3, "should find 3 asserts");
    t.equal(res.failed.length, 1, "should be 1 fail");
    t.equal(res.failed[0].info.length, 1, "one line indented info for test 2");
    t.equal(res.failed[0].info[0], "  STACK", "indented line 1");
    t.equal(res.failed[0].number, 2, "failed test was number 2");
    t.ok(!res.ok, "this should be a fail");
    t.done();
  };
  pump.pipe(splitter()).pipe(tub(onFinish));
};

exports.unnumberedPasses = function (t) {
  var buff = "1..2\nok first pass\nok snd pass";
  var pump = new Pumper(buff);
  var onFinish = function (res) {
    t.equal(res.asserts.length, 2, "should find 2 asserts");
    t.equal(res.asserts[0].number, undefined, "first pass number undefined");
    t.equal(res.asserts[1].number, undefined, "2nd pass number undefined");
    t.equal(res.failed.length, 0, "should be 0 fails");
    t.ok(res.ok, "this should be a pass");
    t.done();
  };
  pump.pipe(splitter()).pipe(tub(onFinish));
};

exports.plan = function (t) {
  var buff = "1..3\nok first pass\nok snd pass";
  var pump = new Pumper(buff);
  var onFinish = function (res) {
    t.equal(res.asserts.length, 2, "should find 2 asserts");
    t.equal(res.failed.length, 0, "should be 0 fails");
    t.ok(!res.ok, "this should not be a pass, missing one assert");
    t.done();
  };
  pump.pipe(splitter()).pipe(tub(onFinish));
};

exports.bailout = function (t) {
  var buff = "1..2\nok first pass\nBail out! something fubar";
  var pump = new Pumper(buff);
  var onFinish = function (res) {
    t.equal(res.plan.start, 1, "plan starts at 1");
    t.equal(res.plan.end, 2, "plan ends at 2");
    t.equal(res.asserts.length, 1, "should find 1 asserts");
    t.equal(res.failed.length, 0, "should be 0 fails");
    t.ok(res.summary.indexOf('something fubar') >= 0, 'bailout string in summary');
    t.ok(!res.ok, "this should not be a pass, bailed out");
    t.done();
  };
  pump.pipe(splitter()).pipe(tub(onFinish));
};


// collect stream that will buffer on the other end
function Collector(onFinish) {
  stream.Writable.call(this);
  this.buf = '';
  this.on('finish', function () {
    onFinish(this.buf);
  });
}
Collector.prototype = Object.create(stream.Writable.prototype);

Collector.prototype._write = function (chunk, encoding, cb) {
  this.buf += chunk;
  cb(null);
};

exports.stream = function (t) {
  var buff = "1..2\nok 1 first pass\n\nnot ok 2 snd fail";
  var pump = new Pumper(buff);
  var onFinish = function (buf) {
    var lines = buf.split('\n');
    t.equal(lines.length, 4, "plan, 2 tests and blank string");
    t.deepEqual(lines, [
        "1..2",
        "✓ 1 first pass",
        "✗ 2 snd fail",
        ""
      ], 'matches input'
    );
    t.done();
  };
  var haul = new Collector(onFinish);
  var noop = function () {};

  pump.pipe(splitter()).pipe(tub(noop)).pipe(haul);
};
