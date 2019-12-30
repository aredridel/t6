import { createHarness } from "../index.js";
import tape from "tape";
import concat from "concat-stream";

import { stripFullStack } from './common.js';

tape.test('failures', function (tt) {
    tt.plan(1);

    var test = createHarness();
    test.createStream().pipe(concat(function (body) {
        tt.equal(
            stripFullStack(body.toString('utf8')),
            'TAP version 13\n'
            + '# error\n'
            + 'not ok 1 Error: this is a message\n'
            + '  ---\n'
            + '    operator: error\n'
            + '    at: Test.<anonymous> ($TEST/error.js:$LINE:$COL)\n'
            + '    stack: |-\n'
            + '      Error: this is a message\n'
            + '          at Test.<anonymous> ($TEST/error.js:$LINE:$COL)\n'
            + '          [... stack stripped ...]\n'
            + '  ...\n'
            + '\n1..1\n'
            + '# tests 1\n'
            + '# pass  0\n'
            + '# fail  1\n'
        );
    }));

    test('error', function (t) {
        t.plan(1);
        t.error(new Error('this is a message'));
    });
});
