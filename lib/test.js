import deepEqual from 'deep-equal';
import defined from 'defined';
import { EventEmitter } from 'events';
import isRegExp from 'is-regex';
import inspect from 'object-inspect';
import url from "url";

const isEnumerable = (obj, prop) => Object.prototype.propertyIsEnumerable.call(obj, prop);
const toLowerCase = str => String.prototype.toLowerCase.call(str);
const isProto = (x, y) => Object.prototype.isPrototypeOf.call(x, y);

const nextTick = typeof setImmediate !== 'undefined'
    ? setImmediate
    : process.nextTick;
const safeSetTimeout = setTimeout;
const safeClearTimeout = clearTimeout;

function getTestArgs(name_, opts_, cb_) {
    var name = '(anonymous)';
    var opts = {};
    var cb;

    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        var t = typeof arg;
        if (t === 'string') {
            name = arg;
        } else if (t === 'object') {
            opts = arg || opts;
        } else if (t === 'function') {
            cb = arg;
        }
    }
    return { name: name, opts: opts, cb: cb };
};

export default class Test extends EventEmitter {
    constructor(name_, opts_, cb_) {
        super();
        var args = getTestArgs(name_, opts_, cb_);

        this.readable = true;
        this.name = args.name || '(anonymous)';
        this.assertCount = 0;
        this.pendingCount = 0;
        this._skip = args.opts.skip || false;
        this._todo = args.opts.todo || false;
        this._timeout = args.opts.timeout;
        this._plan = undefined;
        this._cb = args.cb;
        this._progeny = [];
        this._ok = true;
        var depthEnvVar = process.env.NODE_TAPE_OBJECT_PRINT_DEPTH;
        if (args.opts.objectPrintDepth) {
            this._objectPrintDepth = args.opts.objectPrintDepth;
        } else if (depthEnvVar) {
            if (toLowerCase(depthEnvVar) === 'infinity') {
                this._objectPrintDepth = Infinity;
            } else {
                this._objectPrintDepth = depthEnvVar;
            }
        } else {
            this._objectPrintDepth = 5;
        }

        for (const prop in this) {
            if (typeof this[prop] === 'function') {
                const impl = this[prop];
                this[prop] = (...args) => {
                    return impl.apply(this, args);
                };
            }
        }
    }

    run() {
        this.emit('prerun');
        if (!this._cb || this._skip) {
            return this._end();
        }
        if (this._timeout != null) {
            this.timeoutAfter(this._timeout);
        }

        var callbackReturn = this._cb(this);

        if (
            callbackReturn &&
            typeof callbackReturn.then === 'function'
        ) {
            Promise.resolve(callbackReturn).then(() => {
                if (!this.calledEnd) {
                    this.end();
                }
            }).catch(err => {
                this.fail(err);
                this.end();
            });
            return;
        }

        this.emit('run');
    }

    test(name, opts, cb) {
        var t = new Test(name, opts, cb);
        this._progeny.push(t);
        this.pendingCount++;
        this.emit('test', t);
        t.on('prerun', () => {
            this.assertCount++;
        });

        if (!this._pendingAsserts()) {
            nextTick(() => {
                this._end();
            });
        }

        nextTick(() => {
            if (!this._plan && this.pendingCount == this._progeny.length) {
                this._end();
            }
        });
    }

    comment(msg) {
        if (msg == null) {
            throw new TypeError("comment message must be provided");
        }
        String(msg).trim().split('\n').forEach(aMsg => {
            this.emit('result', String(aMsg).trim().replace(/^#\s*/, ''));
        });
    }

    plan(n) {
        this._plan = n;
        this.emit('plan', n);
    }

    timeoutAfter(ms) {
        if (!ms) throw new Error('timeoutAfter requires a timespan');
        var timeout = safeSetTimeout(() => {
            this.fail('test timed out after ' + ms + 'ms');
            this.end();
        }, ms);
        this.once('end', () => {
            safeClearTimeout(timeout);
        });
    }

    end(err) {
        if (arguments.length >= 1 && !!err) {
            this.ifError(err);
        }

        if (this.calledEnd) {
            this.fail('.end() called twice');
        }
        this.calledEnd = true;
        this._end();
    }

    _end() {
        if (!this._cb && !this._todo) this.fail('# TODO ' + this.name);

        if (this._progeny.length) {
            var t = this._progeny.shift();
            t.on('end', () => { this._end(); });
            t.run();
            return;
        }

        if (!this.ended) this.emit('end');
        var pendingAsserts = this._pendingAsserts();
        if (!this._planError && this._plan !== undefined && pendingAsserts) {
            this._planError = true;
            this.fail('plan != count', {
                expected: this._plan,
                actual: this.assertCount
            });
        }
        this.ended = true;
    }

    _exit() {
        if (this._plan !== undefined &&
            !this._planError && this.assertCount !== this._plan) {
            this._planError = true;
            this.fail('plan != count', {
                expected: this._plan,
                actual: this.assertCount,
                exiting: true
            });
        } else if (!this.ended) {
            this.fail('test exited without ending', {
                exiting: true
            });
        }
    }

    _pendingAsserts() {
        if (this._plan === undefined) {
            return 1;
        }
        return this._plan - (this._progeny.length + this.assertCount);
    }

    _assert(ok, opts) {
        var extra = opts.extra || {};

        ok = !!ok || !!extra.skip;

        var res = {
            id: this.assertCount++,
            ok: ok,
            skip: defined(extra.skip, opts.skip),
            todo: defined(extra.todo, opts.todo, this._todo),
            name: defined(extra.message, opts.message, '(unnamed assert)'),
            operator: defined(extra.operator, opts.operator),
            objectPrintDepth: this._objectPrintDepth
        };
        if ('actual' in opts || 'actual' in extra) {
            res.actual = defined(extra.actual, opts.actual);
        }
        if ('expected' in opts || 'expected' in extra) {
            res.expected = defined(extra.expected, opts.expected);
        }
        this._ok = !!(this._ok && ok);

        if (!ok && !res.todo) {
            res.error = defined(extra.error, opts.error, new Error(res.name));
        }

        if (!ok) {
            var e = new Error('exception');
            var err = (e.stack || '').split('\n');
            var dir = url.resolve(import.meta.url, '.');

            for (var i = 0; i < err.length; i++) {
                /*
                Stack trace lines may resemble one of the following. We need
                to should correctly extract a function name (if any) and
                path / line no. for each line.

                    at myFunction (/path/to/file.js:123:45)
                    at myFunction (/path/to/file.other-ext:123:45)
                    at myFunction (/path to/file.js:123:45)
                    at myFunction (C:\path\to\file.js:123:45)
                    at myFunction (/path/to/file.js:123)
                    at Test.<anonymous> (/path/to/file.js:123:45)
                    at Test.bound [as run] (/path/to/file.js:123:45)
                    at /path/to/file.js:123:45

                Regex has three parts. First is non-capturing group for 'at '
                (plus anything preceding it).

                    /^(?:[^\s]*\s*\bat\s+)/

                Second captures function call description (optional). This is
                not necessarily a valid JS function name, but just what the
                stack trace is using to represent a function call. It may look
                like `<anonymous>` or 'Test.bound [as run]'.

                For our purposes, we assume that, if there is a function
                name, it's everything leading up to the first open
                parentheses (trimmed) before our pathname.

                    /(?:(.*)\s+\()?/

                Last part captures file path plus line no (and optional
                column no).

                    /((?:\/|[a-zA-Z]:\\)[^:\)]+:(\d+)(?::(\d+))?)/
                    */
                var re = /^(?:[^\s]*\s*\bat\s+)(?:(.*)\s+\()?((?:\/|[a-zA-Z]:\\)[^:\)]+:(\d+)(?::(\d+))?)\)$/;
                const cwd =  url.pathToFileURL(process.cwd());
                var lineWithTokens = err[i].replace(cwd, '/\$CWD').replace(dir, '/\$TEST/');
                var m = re.exec(lineWithTokens);

                if (!m) {
                    continue;
                }

                var callDescription = m[1] || '<anonymous>';
                var filePath = m[2].replace('/$CWD', url.pathToFileURL(process.cwd())).replace('/$TEST/', dir);

                if (filePath.slice(0, dir.length) === dir) {
                    continue;
                }

                // Function call description may not (just) be a function name.
                // Try to extract function name by looking at first "word" only.
                res.functionName = callDescription.split(/\s+/)[0];
                res.file = filePath;
                res.line = Number(m[3]);
                if (m[4]) res.column = Number(m[4]);

                res.at = callDescription + ' (' + filePath + ')';
                break;
            }
        }

        this.emit('result', res);

        var pendingAsserts = this._pendingAsserts();
        if (!pendingAsserts) {
            if (extra.exiting) {
                this._end();
            } else {
                nextTick(() => {
                    this._end();
                });
            }
        }

        if (!this._planError && pendingAsserts < 0) {
            this._planError = true;
            this.fail('plan != count', {
                expected: this._plan,
                actual: this._plan - pendingAsserts
            });
        }
    }

    fail(msg, extra) {
        this._assert(false, {
            message: msg,
            operator: 'fail',
            extra: extra
        });
    }

    pass(msg, extra) {
        this._assert(true, {
            message: msg,
            operator: 'pass',
            extra: extra
        });
    }

    skip(msg, extra) {
        this._assert(true, {
            message: msg,
            operator: 'skip',
            skip: true,
            extra: extra
        });
    }
    throws(fn, expected, msg, extra) {
        if (typeof expected === 'string') {
            msg = expected;
            expected = undefined;
        }

        var caught = undefined;

        try {
            fn();
        } catch (err) {
            caught = { error: err };
            if (typeof err == 'object' && err != null && (!isEnumerable(err, 'message') || !('message' in err))) {
                var message = err.message;
                delete err.message;
                err.message = message;
            }
        }

        var passed = caught;

        if (caught) {
            if (typeof expected === 'string' && caught.error && caught.error.message === expected) {
                throw new TypeError('The "error/message" argument is ambiguous. The error message ' + inspect(expected) + ' is identical to the message.');
            }
            if (typeof expected === 'function') {
                if (typeof expected.prototype !== 'undefined' && caught.error instanceof expected) {
                    passed = true;
                } else if (isProto(Error, expected)) {
                    passed = false;
                } else {
                    passed = expected.call({}, caught.error) === true;
                }
            } else if (isRegExp(expected)) {
                passed = expected.test(caught.error);
                expected = inspect(expected);
            } else if (expected && typeof expected === 'object') { // Handle validation objects.
                var keys = Object.keys(expected);
                // Special handle errors to make sure the name and the message are compared as well.
                if (expected instanceof Error) {
                    keys.push('name', 'message');
                } else if (keys.length === 0) {
                    throw new TypeError('`throws` validation object must not be empty');
                }
                passed = keys.every(key => {
                    if (typeof caught.error[key] === 'string' && isRegExp(expected[key]) && expected[key].test(caught.error[key])) {
                        return true;
                    }
                    if (key in caught.error && deepEqual(caught.error[key], expected[key], { strict: true })) {
                        return true;
                    }
                    return false;
                });
            }
        }

        this._assert(!!passed, {
            message: defined(msg, 'should throw'),
            operator: 'throws',
            actual: caught && caught.error,
            expected: expected,
            error: !passed && caught && caught.error,
            extra: extra
        });
    }

    doesNotThrow(fn, expected, msg, extra) {
        if (typeof expected === 'string') {
            msg = expected;
            expected = undefined;
        }
        var caught = undefined;
        try {
            fn();
        }
        catch (err) {
            caught = { error: err };
        }
        this._assert(!caught, {
            message: defined(msg, 'should not throw'),
            operator: 'throws',
            actual: caught && caught.error,
            expected: expected,
            error: caught && caught.error,
            extra: extra
        });
    }

    static skip(name_, _opts, _cb) {
        var args = getTestArgs.apply(null, arguments);
        args.opts.skip = true;
        return new Test(args.name, args.opts, args.cb);
    }

}

function assert(value, msg, extra) {
    this._assert(value, {
        message: defined(msg, 'should be truthy'),
        operator: 'ok',
        expected: true,
        actual: value,
        extra: extra
    });
}
Test.prototype.ok
    = Test.prototype['true']
    = Test.prototype.assert
    = assert;

function notOK(value, msg, extra) {
    this._assert(!value, {
        message: defined(msg, 'should be falsy'),
        operator: 'notOk',
        expected: false,
        actual: value,
        extra: extra
    });
}
Test.prototype.notOk
    = Test.prototype['false']
    = Test.prototype.notok
    = notOK;

function error(err, msg, extra) {
    this._assert(!err, {
        message: defined(msg, String(err)),
        operator: 'error',
        error: err,
        extra: extra
    });
}
Test.prototype.error
    = Test.prototype.ifError
    = Test.prototype.ifErr
    = Test.prototype.iferror
    = error;

function equal(a, b, msg, extra) {
    if (arguments.length < 2) {
        throw new TypeError('two arguments must be provided to compare');
    }
    this._assert(a === b, {
        message: defined(msg, 'should be equal'),
        operator: 'equal',
        actual: a,
        expected: b,
        extra: extra
    });
}
Test.prototype.equal
    = Test.prototype.equals
    = Test.prototype.isEqual
    = Test.prototype.is
    = Test.prototype.strictEqual
    = Test.prototype.strictEquals
    = equal;

function notEqual(a, b, msg, extra) {
    if (arguments.length < 2) {
        throw new TypeError('two arguments must be provided to compare');
    }
    this._assert(a !== b, {
        message: defined(msg, 'should not be equal'),
        operator: 'notEqual',
        actual: a,
        expected: b,
        extra: extra
    });
}
Test.prototype.notEqual
    = Test.prototype.notEquals
    = Test.prototype.notStrictEqual
    = Test.prototype.notStrictEquals
    = Test.prototype.isNotEqual
    = Test.prototype.isNot
    = Test.prototype.not
    = Test.prototype.doesNotEqual
    = Test.prototype.isInequal
    = notEqual;

function tapeDeepEqual(a, b, msg, extra) {
    if (arguments.length < 2) {
        throw new TypeError('two arguments must be provided to compare');
    }
    this._assert(deepEqual(a, b, { strict: true }), {
        message: defined(msg, 'should be equivalent'),
        operator: 'deepEqual',
        actual: a,
        expected: b,
        extra: extra
    });
}
Test.prototype.deepEqual
    = Test.prototype.deepEquals
    = Test.prototype.isEquivalent
    = Test.prototype.same
    = tapeDeepEqual;

function deepLooseEqual(a, b, msg, extra) {
    if (arguments.length < 2) {
        throw new TypeError('two arguments must be provided to compare');
    }
    this._assert(deepEqual(a, b), {
        message: defined(msg, 'should be equivalent'),
        operator: 'deepLooseEqual',
        actual: a,
        expected: b,
        extra: extra
    });
}
Test.prototype.deepLooseEqual
    = Test.prototype.looseEqual
    = Test.prototype.looseEquals
    = deepLooseEqual;

function notDeepEqual(a, b, msg, extra) {
    if (arguments.length < 2) {
        throw new TypeError('two arguments must be provided to compare');
    }
    this._assert(!deepEqual(a, b, { strict: true }), {
        message: defined(msg, 'should not be equivalent'),
        operator: 'notDeepEqual',
        actual: a,
        expected: b,
        extra: extra
    });
}
Test.prototype.notDeepEqual
    = Test.prototype.notDeepEquals
    = Test.prototype.notEquivalent
    = Test.prototype.notDeeply
    = Test.prototype.notSame
    = Test.prototype.isNotDeepEqual
    = Test.prototype.isNotDeeply
    = Test.prototype.isNotEquivalent
    = Test.prototype.isInequivalent
    = notDeepEqual;

function notDeepLooseEqual(a, b, msg, extra) {
    if (arguments.length < 2) {
        throw new TypeError('two arguments must be provided to compare');
    }
    this._assert(!deepEqual(a, b), {
        message: defined(msg, 'should be equivalent'),
        operator: 'notDeepLooseEqual',
        actual: a,
        expected: b,
        extra: extra
    });
}
Test.prototype.notDeepLooseEqual
    = Test.prototype.notLooseEqual
    = Test.prototype.notLooseEquals
    = notDeepLooseEqual;

// vim: set softtabstop=4 shiftwidth=4:
