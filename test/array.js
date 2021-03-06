import { createHarness } from '../index.js';
import tape from "tape";
import concat from 'concat-stream';

tape.test('array test', function (tt) {
    tt.plan(1);

    var test = createHarness();

    test.createStream().pipe(concat(function (rows) {
        tt.same(rows.toString('utf8'), [
            'TAP version 13',
            '# array',
            'ok 1 should be equivalent',
            'ok 2 should be equivalent',
            'ok 3 should be equivalent',
            'ok 4 should be equivalent',
            'ok 5 should be equivalent',
            '',
            '1..5',
            '# tests 5',
            '# pass  5',
            '',
            '# ok'
        ].join('\n') + '\n');
    }));

    test('array', function (t) {
        t.plan(5);

        function thinger(fn, g) {
            var xs = fn([ 1, 2, fn([ 3, 4 ]) ]);
            var ys = fn([ 5, 6 ]);
            g(fn([ xs, ys ]));
        } + ')()';

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
                t.same(xs, [ [ 1, 2, [ 3, 4 ] ], [ 5, 6 ] ]);
            }
        );
    });
});
