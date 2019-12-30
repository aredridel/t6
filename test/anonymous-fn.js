import { createHarness } from "../index.js";
import tape from 'tape';
import concat from 'concat-stream';

import {stripFullStack } from './common.js';
import testWrapper from './anonymous-fn/test-wrapper.js';

tape.test('inside anonymous functions', function (tt) {
    tt.plan(1);

    var test = createHarness();
    var tc = function (rows) {
        var body = stripFullStack(rows.toString('utf8'));

        tt.same(body, [
            'TAP version 13',
            '# wrapped test failure',
            'not ok 1 fail',
            '  ---',
            '    operator: fail',
            '    at: Test.<anonymous> ($TEST/anonymous-fn/test-wrapper.js:$LINE:$COL)',
            '    stack: |-',
            '      Error: fail',
            '          [... stack stripped ...]',
            '          at $TEST/anonymous-fn.js:$LINE:$COL',
            '          at Test.<anonymous> ($TEST/anonymous-fn/test-wrapper.js:$LINE:$COL)',
            '          [... stack stripped ...]',
            '  ...',
            '',
            '1..1',
            '# tests 1',
            '# pass  0',
            '# fail  1'
        ].join('\n') + '\n');
    };

    test.createStream().pipe(concat(tc));

    test('wrapped test failure', testWrapper(function (t) {
        t.fail('fail');
        t.end();
    }));
});
