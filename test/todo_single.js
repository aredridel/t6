import tape from 'tape';
import { createHarness } from '../index.js';
import concat from 'concat-stream';

import { stripFullStack } from './common.js';

tape.test('tape todo test', function (assert) {
    var test = createHarness({ exit: false });
    assert.plan(1);

    test.createStream().pipe(concat(function (body) {
        assert.equal(
            stripFullStack(body.toString('utf8')),
            'TAP version 13\n'
            + '# TODO failure\n'
            + 'not ok 1 should be equal # TODO\n'
            + '  ---\n'
            + '    operator: equal\n'
            + '    expected: false\n'
            + '    actual:   true\n'
            + '    at: Test.<anonymous> ($TEST/todo_single.js:$LINE:$COL)\n'
            + '  ...\n'
            + '\n'
            + '1..1\n'
            + '# tests 1\n'
            + '# pass  1\n'
            + '\n'
            + '# ok\n'
        );
    }));

    test('failure', { todo: true }, function (t) {
        t.equal(true, false);
        t.end();
    });
});
