import tape from "tape";
import concat from "concat-stream";
import { createHarness } from "../index.js";

import { stripFullStack } from "./common.js";

tape.test('comparison of undefined in expectation', function (tt) {
    tt.plan(1);

    var test = createHarness();
    test.createStream().pipe(concat(function (body) {
        tt.equal(
            stripFullStack(body.toString('utf8')),
            'TAP version 13\n'
            + '# undef\n'
            + 'not ok 1 should be equivalent\n'
            + '  ---\n'
            + '    operator: deepEqual\n'
            + '    expected: |-\n'
            + '      { beep: undefined }\n'
            + '    actual: |-\n'
            + '      {}\n'
            + '    at: Test.<anonymous> ($TEST/undef.js:$LINE:$COL)\n'
            + '    stack: |-\n'
            + '      Error: should be equivalent\n'
            + '          [... stack stripped ...]\n'
            + '          at Test.<anonymous> ($TEST/undef.js:$LINE:$COL)\n'
            + '          [... stack stripped ...]\n'
            + '  ...\n'
            + '\n'
            + '1..1\n'
            + '# tests 1\n'
            + '# pass  0\n'
            + '# fail  1\n'
        );
    }));

    test('undef', function (t) {
        t.plan(1);
        t.deepEqual({}, { beep: undefined });
    });
});
