import { createHarness } from '../index.js';
import tape from 'tape';
import concat from 'concat-stream';
import inspect from 'object-inspect';
import assign from 'object.assign';

import { stripFullStack } from './common.js';

function fn() {
    throw new TypeError('RegExp');
}

function getNonFunctionMessage(fn) {
    try {
        fn();
    } catch (e) {
        return e.message;
    }
}

var getter = function () { return 'message'; };
var messageGetterError = Object.defineProperty(
    { custom: 'error' },
    'message',
    { configurable: true, enumerable: true, get: getter }
);
var thrower = function () { throw messageGetterError; };

tape.test('failures', function (tt) {
    tt.plan(1);

    var test = createHarness();
    test.createStream().pipe(concat(function (body) {
        tt.equal(
            stripFullStack(body.toString('utf8')),
            'TAP version 13\n'
            + '# non functions\n'
            + 'ok 1 should throw\n'
            + 'ok 2 should throw\n'
            + 'ok 3 should throw\n'
            + 'ok 4 should throw\n'
            + 'ok 5 should throw\n'
            + 'ok 6 should throw\n'
            + 'ok 7 should throw\n'
            + 'ok 8 should throw\n'
            + '# function\n'
            + 'not ok 9 should throw\n'
            + '  ---\n'
            + '    operator: throws\n'
            + '    expected: undefined\n'
            + '    actual:   undefined\n'
            + '    at: Test.<anonymous> ($TEST/throws.js:$LINE:$COL)\n'
            + '    stack: |-\n'
            + '      Error: should throw\n'
            + '          [... stack stripped ...]\n'
            + '          at Test.<anonymous> ($TEST/throws.js:$LINE:$COL)\n'
            + '          [... stack stripped ...]\n'
            + '  ...\n'
            + '# custom error messages\n'
            + 'ok 10 "message" is enumerable\n'
            + "ok 11 { custom: 'error', message: 'message' }\n"
            + 'ok 12 getter is still the same\n'
            + '# throws null\n'
            + 'ok 13 throws null\n'
            + '# wrong type of error\n'
            + 'not ok 14 throws actual\n'
            + '  ---\n'
            + '    operator: throws\n'
            + '    expected: |-\n'
            + '      [Function: TypeError]\n'
            + '    actual: |-\n'
            + "      { [RangeError: actual!] message: 'actual!' }\n"
            + '    at: Test.<anonymous> ($TEST/throws.js:$LINE:$COL)\n'
            + '    stack: |-\n'
            + '      RangeError: actual!\n'
            + '          at Test.<anonymous> ($TEST/throws.js:$LINE:$COL)\n'
            + '          [... stack stripped ...]\n'
            + '  ...\n'
            + '# object\n'
            + 'ok 15 object properties are validated\n'
            + '# object with regexes\n'
            + 'ok 16 object with regex values is validated\n'
            + '# similar error object\n'
            + 'ok 17 throwing a similar error\n'
            + '# validate with regex\n'
            + 'ok 18 regex against toString of error\n'
            + '# custom error validation\n'
            + 'ok 19 error is SyntaxError\n'
            + 'ok 20 error matches /value/\n'
            + 'ok 21 unexpected error\n'
            + '# throwing primitives\n'
            + 'ok 22 primitive: null\n'
            + 'ok 23 primitive: undefined\n'
            + 'ok 24 primitive: 0\n'
            + 'ok 25 primitive: NaN\n'
            + 'ok 26 primitive: 42\n'
            + 'ok 27 primitive: Infinity\n'
            + 'ok 28 primitive: \'\'\n'
            + 'ok 29 primitive: \'foo\'\n'
            + 'ok 30 primitive: true\n'
            + 'ok 31 primitive: false\n'
            + '# ambiguous arguments\n'
            + 'ok 32 Second\n'
            + 'ok 33 Second\n'
            + 'ok 34 Second\n'
            + 'ok 35 should throw\n'
            + 'not ok 36 should throw\n'
            + '  ---\n'
            + '    operator: throws\n'
            + '    expected: |-\n'
            + '      \'/Second$/\'\n'
            + '    actual: |-\n'
            + '      { [Error: First] message: \'First\' }\n'
            + '    at: Test.<anonymous> ($TEST/throws.js:$LINE:$COL)\n'
            + '    stack: |-\n'
            + '      Error: First\n'
            + '          at throwingFirst ($TEST/throws.js:$LINE:$COL)\n'
            + '          [... stack stripped ...]\n'
            + '          at Test.<anonymous> ($TEST/throws.js:$LINE:$COL)\n'
            + '          [... stack stripped ...]\n'
            + '  ...\n'
            + '\n1..36\n'
            + '# tests 36\n'
            + '# pass  33\n'
            + '# fail  3\n'
        );
    }));

    test('non functions', function (t) {
        t.plan(8);
        t.throws();
        t.throws(null);
        t.throws(true);
        t.throws(false);
        t.throws('abc');
        t.throws(/a/g);
        t.throws([]);
        t.throws({});
    });

    test('function', function (t) {
        t.plan(1);
        t.throws(function () {});
    });

    test('custom error messages', function (t) {
        t.plan(3);
        t.equal(Object.prototype.propertyIsEnumerable.call(messageGetterError, 'message'), true, '"message" is enumerable');
        t.throws(thrower, "{ custom: 'error', message: 'message' }");
        t.equal(Object.getOwnPropertyDescriptor(messageGetterError, 'message').get, getter, 'getter is still the same');
    });

    test('throws null', function (t) {
        t.plan(1);
        t.throws(function () { throw null; }, 'throws null');
        t.end();
    });

    test('wrong type of error', function (t) {
        t.plan(1);
        var actual = new RangeError('actual!');
        t.throws(function () { throw actual; }, TypeError, 'throws actual');
        t.end();
    });

    // taken from https://nodejs.org/api/assert.html#assert_assert_throws_fn_error_message
    var err = new TypeError('Wrong value');
    err.code = 404;
    err.foo = 'bar';
    err.info = {
        nested: true,
        baz: 'text'
    };
    err.reg = /abc/i;

    test('object', function (t) {
        t.plan(1);

        t.throws(
            function () { throw err; },
            {
                name: 'TypeError',
                message: 'Wrong value',
                info: {
                    nested: true,
                    baz: 'text'
                }
                // Only properties on the validation object will be tested for.
                // Using nested objects requires all properties to be present. Otherwise
                // the validation is going to fail.
            },
            'object properties are validated'
        );

        t.end();
    });

    test('object with regexes', function (t) {
        t.plan(1);
        t.throws(
            function () { throw err; },
            {
                // The `name` and `message` properties are strings and using regular
                // expressions on those will match against the string. If they fail, an
                // error is thrown.
                name: /^TypeError$/,
                message: /Wrong/,
                foo: 'bar',
                info: {
                    nested: true,
                    // It is not possible to use regular expressions for nested properties!
                    baz: 'text'
                },
                // The `reg` property contains a regular expression and only if the
                // validation object contains an identical regular expression, it is going
                // to pass.
                reg: /abc/i
            },
            'object with regex values is validated'
        );
        t.end();
    });

    test('similar error object', function (t) {
        t.plan(1);
        t.throws(
            function () {
                var otherErr = new TypeError('Not found');
                // Copy all enumerable properties from `err` to `otherErr`.
                assign(otherErr, err);
                throw otherErr;
            },
            // The error's `message` and `name` properties will also be checked when using
            // an error as validation object.
            err,
            'throwing a similar error'
        );
        t.end();
    });

    test('validate with regex', function (t) {
        t.plan(1);
        t.throws(
            function () { throw new Error('Wrong value'); },
            /^Error: Wrong value$/,
            'regex against toString of error'
        );
        t.end();
    });

    test('custom error validation', function (t) {
        t.plan(3);
        t.throws(
            function () { throw new SyntaxError('Wrong value'); },
            function (error) {
                t.ok(error instanceof SyntaxError, 'error is SyntaxError');
                t.ok((/value/).test(error), 'error matches /value/');
                // Avoid returning anything from validation functions besides `true`.
                // Otherwise, it's not clear what part of the validation failed. Instead,
                // throw an error about the specific validation that failed (as done in this
                // example) and add as much helpful debugging information to that error as
                // possible.
                return true;
            },
            'unexpected error'
        );
        t.end();
    });

    test('throwing primitives', function (t) {
        [null, undefined, 0, NaN, 42, Infinity, '', 'foo', true, false].forEach(function (primitive) {
            t.throws(function () { throw primitive; }, 'primitive: ' + inspect(primitive));
        });

        t.end();
    });

    test('ambiguous arguments', function (t) {
        function throwingFirst() {
            throw new Error('First');
        }

        function throwingSecond() {
            throw new Error('Second');
        }

        function notThrowing() {}

        // The second argument is a string and the input function threw an Error.
        // The first case will not throw as it does not match for the error message
        // thrown by the input function!
        t.throws(throwingFirst, 'Second');
        // In the next example the message has no benefit over the message from the
        // error and since it is not clear if the user intended to actually match
        // against the error message, Node.js throws an `ERR_AMBIGUOUS_ARGUMENT` error.
        t.throws(throwingSecond, 'Second');
        // TypeError [ERR_AMBIGUOUS_ARGUMENT]

        // The string is only used (as message) in case the function does not throw:
        t.doesNotThrow(notThrowing, 'Second');
        // AssertionError [ERR_ASSERTION]: Missing expected exception: Second

        // If it was intended to match for the error message do this instead:
        // It does not fail because the error messages match.
        t.throws(throwingSecond, /Second$/);

        // If the error message does not match, an AssertionError is thrown.
        t.throws(throwingFirst, /Second$/);
        // AssertionError [ERR_ASSERTION]
        t.end();
    });
});
