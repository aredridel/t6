import defined from 'defined';
import createDefaultStream from './lib/default_stream.js';
import Test from './lib/test.js';
import createResult from './lib/results.js';
import through from 'through';

var canEmitExit = typeof process !== 'undefined' && process
    && typeof process.on === 'function' && process.browser !== true
;
var canExit = typeof process !== 'undefined' && process
    && typeof process.exit === 'function'
;

var nextTick = typeof setImmediate !== 'undefined'
    ? setImmediate
    : process.nextTick
;

export default function lazyLoad() {
    return getHarness().apply(this, arguments);
};

Object.keys(Test.prototype).forEach(prop => {
    lazyLoad[prop] = function () {
        const harness = getHarness();
        console.warn(harness, prop, harness[prop]);
        return harness[prop].apply(harness, arguments);
    };
});

lazyLoad.skip = Test.skip;
lazyLoad.only = only;
lazyLoad.onFinish = onFinish;
lazyLoad.onFailure = onFailure;

var harness;

export function only() {
    return getHarness().only.apply(this, arguments);
};

export function createStream(opts) {
    if (!opts) opts = {};
    if (!harness) {
        var output = through();
        getHarness({ stream: output, objectMode: opts.objectMode });
        return output;
    }
    return harness.createStream(opts);
};

export function onFinish() {
    const harness = getHarness();
    return harness.onFinish.apply(harness, arguments);
};

export function onFailure() {
    const harness = getHarness();
    return harness.onFailure.apply(harness, arguments);
};

export function getHarness(opts) {
    if (!opts) opts = {};
    if (!('autoclose' in opts)) opts.autoclose = !canEmitExit;
    if (!harness) harness = createExitHarness(opts);
    return harness;
}

function createExitHarness(conf) {
    if (!conf) conf = {};
    var harness = createHarness({
        autoclose: defined(conf.autoclose, false)
    });

    var stream = harness.createStream({ objectMode: conf.objectMode });
    var es = stream.pipe(conf.stream || createDefaultStream());
    if (canEmitExit) {
        es.on('error', function (err) { harness._exitCode = 1; });
    }

    var ended = false;
    stream.on('end', function () { ended = true; });

    if (conf.exit === false) return harness;
    if (!canEmitExit || !canExit) return harness;

    process.on('exit', function (code) {
        // let the process exit cleanly.
        if (code !== 0) {
            return;
        }

        if (!ended) {
            var only = harness._results._only;
            for (var i = 0; i < harness._tests.length; i++) {
                var t = harness._tests[i];
                if (only && t !== only) continue;
                t._exit();
            }
        }
        harness.close();
        process.exit(code || harness._exitCode);
    });

    return harness;
}

export { createHarness, Test, lazyLoad as test };

var exitInterval;

function createHarness(conf_) {
    if (!conf_) conf_ = {};
    var results = createResult();
    if (conf_.autoclose !== false) {
        results.once('done', function () { results.close(); });
    }

    var test = function (name, conf, cb) {
        var t = new Test(name, conf, cb);
        test._tests.push(t);

        (function inspectCode(st) {
            st.on('test', function sub(st_) {
                inspectCode(st_);
            });
            st.on('result', function (r) {
                if (!r.todo && !r.ok && typeof r !== 'string') test._exitCode = 1;
            });
        })(t);

        results.push(t);
        return t;
    };
    test._results = results;

    test._tests = [];

    test.createStream = function (opts) {
        return results.createStream(opts);
    };

    test.onFinish = function (cb) {
        results.on('done', cb);
    };

    test.onFailure = function (cb) {
        results.on('fail', cb);
    };

    var only = false;
    test.only = function () {
        if (only) throw new Error('there can only be one only test');
        only = true;
        var t = test.apply(null, arguments);
        results.only(t);
        return t;
    };
    test._exitCode = 0;

    test.close = function () { results.close(); };

    return test;
}
