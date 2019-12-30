import {createHarness} from '../index.js';
import tape from 'tape';
import concat from 'concat-stream';

import { stripFullStack } from "./common.js";

tape.test('failure', function (tt) {
    tt.plan(1);

    var test = createHarness({ exit: false });
    var tc = function (rows) {
        tt.same(stripFullStack(rows.toString('utf8')), [
            'TAP version 13',
            '# array',
            'ok 1 should be equivalent',
            'ok 2 should be equivalent',
            'ok 3 should be equivalent',
            'ok 4 should be equivalent',
            'not ok 5 should be equivalent',
            '  ---',
            '    operator: deepEqual',
            '    expected: [ [ 1, 2, [ 3, 4444 ] ], [ 5, 6 ] ]',
            '    actual:   [ [ 1, 2, [ 3, 4 ] ], [ 5, 6 ] ]',
            '    at: thinger ($TEST/fail.js:$LINE:$COL)',
            '    stack: |-',
            '      Error: should be equivalent',
            '          [... stack stripped ...]',
            '          at $TEST/fail.js:$LINE:$COL',
            '          at thinger ($TEST/fail.js:$LINE:$COL)',
            '          at Test.<anonymous> ($TEST/fail.js:$LINE:$COL)',
            '          [... stack stripped ...]',
            '  ...',
            '',
            '1..5',
            '# tests 5',
            '# pass  4',
            '# fail  1',
            ''
        ].join('\n'));
    };

    test.createStream().pipe(concat(tc));

    test('array', function (t) {
        t.plan(5);

        function thinger(fn, g) {
            var xs = fn([ 1, 2, fn([ 3, 4 ]) ]);
            var ys = fn([ 5, 6 ]);
            g(fn([ xs, ys ]));
        }

        var arrays = [
            [ 3, 4 ],
            [ 1, 2, [ 3, 4 ] ],
            [ 5, 6 ],
            [ [ 1, 2, [ 3, 4 ] ], [ 5, 6 ] ],
        ];

        thinger(
            function (xs) {
                t.same(arrays.shift(), xs);
                return xs;
            },
            function (xs) {
                t.same(xs, [ [ 1, 2, [ 3, 4444 ] ], [ 5, 6 ] ]);
            }
        );
    });
});
