import { createHarness } from '../index.js';
import tap from 'tap';
import concat from 'concat-stream';

import { stripFullStack } from './common.js';

tap.test('no callback', function (tt) {
    tt.plan(1);

    var test = createHarness();
    var tc = function (rows) {
        var body = stripFullStack(rows.toString('utf8'));

        tt.same(body, [
            'TAP version 13',
            '# No callback.',
            'not ok 1 # TODO No callback.',
            '  ---',
            '    operator: fail',
            '    stack: |-',
            '      Error: # TODO No callback.',
            '          [... stack stripped ...]',
            '  ...',
            '',
            '1..1',
            '# tests 1',
            '# pass  0',
            '# fail  1',
        ].join('\n') + '\n');
    };

    test.createStream().pipe(concat(tc));

    test('No callback.');
});
