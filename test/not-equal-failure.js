import { createHarness } from '../index.js';
import tape from 'tape';
import concat from 'concat-stream';
import tapParser from 'tap-parser';
import { getDiag, stripFullStack } from './common.js';

tape.test('not equal failure', function (assert) {
    var test = createHarness({ exit: false });
    var stream = test.createStream();
    var parser = new tapParser();
    assert.plan(3);

    stream.pipe(parser);
    stream.pipe(concat(function (body) {
        assert.equal(
            stripFullStack(body.toString('utf8')),
            'TAP version 13\n'
            + '# not equal\n'
            + 'not ok 1 should not be equal\n'
            + '  ---\n'
            + '    operator: notEqual\n'
            + '    expected: 2\n'
            + '    actual:   2\n'
            + '    at: Test.<anonymous> ($TEST/not-equal-failure.js:$LINE:$COL)\n'
            + '    stack: |-\n'
            + '      Error: should not be equal\n'
            + '          [... stack stripped ...]\n'
            + '          at Test.<anonymous> ($TEST/not-equal-failure.js:$LINE:$COL)\n'
            + '          [... stack stripped ...]\n'
            + '  ...\n'
            + '\n'
            + '1..1\n'
            + '# tests 1\n'
            + '# pass  0\n'
            + '# fail  1\n'
        );

        assert.deepEqual(getDiag(body), {
            operator: 'notEqual',
            expected: 2,
            actual: 2
        });
    }));

    parser.once('assert', function (data) {
        delete data.diag.stack;
        delete data.diag.at;
        assert.deepEqual(data, {
            ok: false,
            id: 1,
            name: 'should not be equal',
            diag: {
                operator: 'notEqual',
                expected: 2,
                actual: 2
            },
            fullname: ''
        });
    });

    test("not equal", function (t) {
        t.plan(1);
        t.notEqual(2, 2);
    });
});
