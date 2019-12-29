import { createHarness } from '../index.js';
import tap from 'tap';
import concat from 'concat-stream';

import { stripFullStack } from "./common.js";

tap.test('array test', function (tt) {
    tt.plan(1);

    var test = createHarness({ exit: false });
    var tc = function (rows) {
        tt.same(stripFullStack(rows.toString('utf8')), [
            'TAP version 13',
            '# fail',
            'not ok 1 this should fail',
            '  ---',
            '    operator: fail',
            '    at: Test.<anonymous> ($TEST/has%20spaces.js:$LINE:$COL)',
            '    stack: |-',
            '      Error: this should fail',
            '          [... stack stripped ...]',
            '          at Test.<anonymous> ($TEST/has%20spaces.js:$LINE:$COL)',
            '          [... stack stripped ...]',
            '  ...',
            '',
            '1..1',
            '# tests 1',
            '# pass  0',
            '# fail  1',
            ''
        ].join('\n'));
    };

    test.createStream().pipe(concat(tc));

    test('fail', function (t) {
        t.fail('this should fail');
        t.end();
    });
});
