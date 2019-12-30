import falafel from 'falafel';
import { createHarness } from '../index.js';
import tape from 'tape';
import concat from 'concat-stream';

import { stripFullStack } from './common.js';

tape.test('array test', function (tt) {
    tt.plan(1);

    var test = createHarness({ exit: false });
    var tc = function (rows) {
        tt.same(stripFullStack(rows.toString('utf8')), [
            'TAP version 13',
            '# array',
            'ok 1 good',
            'ok 2 good',
            'ok 3 good',
            'ok 4 too many',
            'not ok 5 plan != count',
            '  ---',
            '    operator: fail',
            '    expected: 3',
            '    actual:   4',
            '    at: Test.<anonymous> ($TEST/too_many.js:$LINE:$COL)',
            '    stack: |-',
            '      Error: plan != count',
            '          [... stack stripped ...]',
            '          at Test.<anonymous> ($TEST/too_many.js:$LINE:$COL)',
            '          [... stack stripped ...]',
            '  ...',
            'ok 6 good',
            '',
            '1..6',
            '# tests 6',
            '# pass  5',
            '# fail  1'
        ].join('\n') + '\n');
    };

    test.createStream().pipe(concat(tc));

    test('array', function (t) {
        t.plan(3);

        t.pass('good');
        t.pass('good');
        t.pass('good');
        t.pass('too many');

        t.plan(1);
        t.pass('good');
    });
});
