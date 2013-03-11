var Transform = require('stream').Transform
  , util = require('util')
  , inherits = util.inherits
  , format = util.format;

var re = {
  // number optional, matches delimited by at least one space `ok number comment`
  // maybe additionally delimited by a dash between these as well
  assert: /^(not )?ok\s+\-?\s*(\d+)?\s*\-?\s*(.*)/,
  plan: /^(\d+)\.{2}(\d+)\b/,
  comment: /^#\s*(.+)/,
  bail: /^Bail out!\s*(.*)/,
  version: /^TAP\s+version\s+(\d+)/i
};

// order to regexp match on - based on approximate frequencies of each type
var order = [
  'assert',
  'comment',
  'plan',
  'version',
  'bail'
];

// assumes you feed it LINES (i.e. pass it through splitter first)
function Tapper(onFinish, opts) {
  if (!(this instanceof Tapper)) {
    return new Tapper(onFinish, opts);
  }
  Transform.call(this, opts);
  this.asserts = [];
  this.numFails = 0;
  this.plan = {};
  this.bail = null;
  this.on('finish', (function () {
    var r = {
      plan   : this.plan,
      asserts: this.asserts,
      version: this.version,
      failed : [],
      ok     : false
    };
    var fails = this.numFails;

    if (this.bail !== null) {
      r.summary = format('test bailed out after %d asserts with: %s'
        , r.asserts.length
        , this.bail
      );
    }
    else if (Object.keys(r.plan).length !== 2) {
      r.summary = 'no plan found';
    }
    else {
      var len = r.plan.end - r.plan.start + 1; // boundries inclusive
      var missed = len - r.asserts.length;
      if (missed !== 0)  {
        r.summary = format('%d assertions not reported', missed);
      }
      else if (fails > 0) {
        r.summary = format('%d / %d assertions failed', fails, r.asserts.length);
        r.failed = r.asserts.filter(function (a) {
          return !a.ok;
        });
      }
      else {
        r.summary = format('all %d assertions passed', r.asserts.length);
        r.ok = true;
      }
    }
    onFinish(r);
  }).bind(this));
}
inherits(Tapper, Transform);

// assumes input is split before piped to Tapper
Tapper.prototype._transform = function (line, encoding, cb) {
  if (!line) {
    return cb();
  }
  for (var i = 0; i < order.length; i += 1) {
    var type = order[i];
    var reg = re[type];
    var m = reg.exec(line);
    if (!m) {
      continue;
    }

    // here => message matches one of the regexps
    if (type === 'assert') {
      var obj = {
        ok    : !m[1],
        number: m[2] && Number(m[2]), // undefined if not set
        name  : m[3],
        info  : [] // may push lines indented for this assert later
      };
      this.asserts.push(obj); // for 'finish' event
      this.numFails += Number(!obj.ok);

      // as a readable stream we provide simple output
      var out = [obj.ok ? '✓' : '✗'];
      if (obj.number !== undefined) {
        out.push(m[2]);
      }
      out.push(obj.name);
      this.push(out.join(' ') + '\n');
    }
    else if (type === 'plan') {
      var p = /^(\d+)\.\.(\d+)\b/.exec(line);
      this.plan = {
        start: Number(p[1]),
        end: Number(p[2])
      };
    }
    else if (type === 'version') {
      this.version = /^\d+(\.\d*)?$/.test(m[1]) ? Number(m[1]) : m[1];
    }
    else if (type === 'bail') {
      this.bail = m[1]; // bailout reason (may be empty string)
      this.end();
    }
    // ignore type === 'comment' in this module

    return cb();
  }

  // indented lines are expected to be attached to the previous assert
  if (/^\s{2}/.test(line) && this.asserts.length > 0) {
    // --tap still produces stack traces that are indented
    // we pass them through and attach them to the last assert
    this.push(line + '\n');
    this.asserts[this.asserts.length - 1].info.push(line + '');
    return cb();
  }

  // if we are here, we failed to do find anything sensible in this line
  // TODO: perhaps have haltOnError as an option to just silently ignore these lines
  cb(new Error("failed to parse line: '" + line + "'"));
};

module.exports = Tapper;
