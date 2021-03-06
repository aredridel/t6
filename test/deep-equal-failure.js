import { createHarness } from "../index.js";
import tape from 'tape';
import concat from 'concat-stream';
import tapParser from 'tap-parser';
import { getDiag, stripFullStack } from './common.js';

tape.test('deep equal failure', function (assert) {
    var test = createHarness({ exit: false });
    var stream = test.createStream();
    var parser = new tapParser();
    assert.plan(3);

    stream.pipe(parser);
    stream.pipe(concat(function (body) {
        assert.equal(
            stripFullStack(body.toString('utf8')),
            'TAP version 13\n'
            + '# deep equal\n'
            + 'not ok 1 should be equal\n'
            + '  ---\n'
            + '    operator: equal\n'
            + '    expected: |-\n'
            + '      { b: 2 }\n'
            + '    actual: |-\n'
            + '      { a: 1 }\n'
            + '    at: Test.<anonymous> ($TEST/deep-equal-failure.js:$LINE:$COL)\n'
            + '    stack: |-\n'
            + '      Error: should be equal\n'
            + '          [... stack stripped ...]\n'
            + '          at Test.<anonymous> ($TEST/deep-equal-failure.js:$LINE:$COL)\n'
            + '          [... stack stripped ...]\n'
            + '  ...\n'
            + '\n'
            + '1..1\n'
            + '# tests 1\n'
            + '# pass  0\n'
            + '# fail  1\n'
        );

        assert.deepEqual(getDiag(body), {
            operator: 'equal',
            expected: '{ b: 2 }',
            actual: '{ a: 1 }'
        });
    }));

    parser.once('assert', function (data) {
        delete data.diag.stack;
        delete data.diag.at;
        assert.deepEqual(data, {
            ok: false,
            id: 1,
            name: 'should be equal',
            diag: {
                operator: 'equal',
                expected: '{ b: 2 }',
                actual: '{ a: 1 }'
            },
            fullname: ''
        });
    });

    test("deep equal", function (t) {
        t.plan(1);
        t.equal({a: 1}, {b: 2});
    });
});

tape.test('deep equal failure, depth 6, with option', function (assert) {
    var test = createHarness({ exit: false });
    var stream = test.createStream();
    var parser = new tapParser();
    assert.plan(3);

    stream.pipe(parser);
    stream.pipe(concat(function (body) {
        assert.equal(
            stripFullStack(body.toString('utf8')),
            'TAP version 13\n'
            + '# deep equal\n'
            + 'not ok 1 should be equal\n'
            + '  ---\n'
            + '    operator: equal\n'
            + '    expected: |-\n'
            + '      { a: { a1: { a2: { a3: { a4: { a5: 2 } } } } } }\n'
            + '    actual: |-\n'
            + '      { a: { a1: { a2: { a3: { a4: { a5: 1 } } } } } }\n'
            + '    at: Test.<anonymous> ($TEST/deep-equal-failure.js:$LINE:$COL)\n'
            + '    stack: |-\n'
            + '      Error: should be equal\n'
            + '          [... stack stripped ...]\n'
            + '          at Test.<anonymous> ($TEST/deep-equal-failure.js:$LINE:$COL)\n'
            + '          [... stack stripped ...]\n'
            + '  ...\n'
            + '\n'
            + '1..1\n'
            + '# tests 1\n'
            + '# pass  0\n'
            + '# fail  1\n'
        );

        assert.deepEqual(getDiag(body), {
            operator: 'equal',
            expected: '{ a: { a1: { a2: { a3: { a4: { a5: 2 } } } } } }',
            actual: '{ a: { a1: { a2: { a3: { a4: { a5: 1 } } } } } }'
        });
    }));

    parser.once('assert', function (data) {
        delete data.diag.stack;
        delete data.diag.at;
        assert.deepEqual(data, {
            ok: false,
            id: 1,
            name: 'should be equal',
            diag: {
                operator: 'equal',
                expected: '{ a: { a1: { a2: { a3: { a4: { a5: 2 } } } } } }',
                actual: '{ a: { a1: { a2: { a3: { a4: { a5: 1 } } } } } }'
            },
            fullname: ''
        });
    });

    test("deep equal", {objectPrintDepth: 6}, function (t) {
        t.plan(1);
        t.equal({ a: { a1: { a2: { a3: { a4: { a5: 1 } } } } } }, { a: { a1: { a2: { a3: { a4: { a5: 2 } } } } } });
    });
});

tape.test('deep equal failure, depth 6, without option', function (assert) {
    var test = createHarness({ exit: false });
    var stream = test.createStream();
    var parser = new tapParser();
    assert.plan(3);

    stream.pipe(parser);
    stream.pipe(concat(function (body) {
        assert.equal(
            stripFullStack(body.toString('utf8')),
            'TAP version 13\n'
            + '# deep equal\n'
            + 'not ok 1 should be equal\n'
            + '  ---\n'
            + '    operator: equal\n'
            + '    expected: |-\n'
            + '      { a: { a1: { a2: { a3: { a4: [Object] } } } } }\n'
            + '    actual: |-\n'
            + '      { a: { a1: { a2: { a3: { a4: [Object] } } } } }\n'
            + '    at: Test.<anonymous> ($TEST/deep-equal-failure.js:$LINE:$COL)\n'
            + '    stack: |-\n'
            + '      Error: should be equal\n'
            + '          [... stack stripped ...]\n'
            + '          at Test.<anonymous> ($TEST/deep-equal-failure.js:$LINE:$COL)\n'
            + '          [... stack stripped ...]\n'
            + '  ...\n'
            + '\n'
            + '1..1\n'
            + '# tests 1\n'
            + '# pass  0\n'
            + '# fail  1\n'
        );

        assert.deepEqual(getDiag(body), {
            operator: 'equal',
            expected: '{ a: { a1: { a2: { a3: { a4: [Object] } } } } }',
            actual: '{ a: { a1: { a2: { a3: { a4: [Object] } } } } }'
        });
    }));

    parser.once('assert', function (data) {
        delete data.diag.stack;
        delete data.diag.at;
        assert.deepEqual(data, {
            ok: false,
            id: 1,
            name: 'should be equal',
            diag: {
                operator: 'equal',
                expected: '{ a: { a1: { a2: { a3: { a4: [Object] } } } } }',
                actual: '{ a: { a1: { a2: { a3: { a4: [Object] } } } } }'
            },
            fullname: ''
        });
    });

    test("deep equal", function (t) {
        t.plan(1);
        t.equal({ a: { a1: { a2: { a3: { a4: { a5: 1 } } } } } }, { a: { a1: { a2: { a3: { a4: { a5: 2 } } } } } });
    });
});
