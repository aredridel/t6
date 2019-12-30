import { createHarness } from '../index.js';
import tape from 'tape';
import concat from 'concat-stream';

tape.test('array test', function (tt) {
    tt.plan(1);

    var test = createHarness();
    var tc = function (rows) {
        tt.same(rows.toString('utf8'), [
            'TAP version 13',
            '# nested array test',
            'ok 1 should be equivalent',
            'ok 2 should be equivalent',
            'ok 3 should be equivalent',
            'ok 4 should be equivalent',
            'ok 5 should be equivalent',
            '# inside test',
            'ok 6 should be truthy',
            'ok 7 should be truthy',
            '# another',
            'ok 8 should be truthy',
            '',
            '1..8',
            '# tests 8',
            '# pass  8',
            '',
            '# ok'
        ].join('\n') + '\n');
    };

    test.createStream().pipe(concat(tc));

    test('nested array test', function (t) {
        t.plan(6);

        function thinger(fn, g) {
            var xs = fn([ 1, 2, fn([ 3, 4 ]) ]);
            var ys = fn([ 5, 6 ]);
            g(fn([ xs, ys ]));
        }

        t.test('inside test', function (q) {
            q.plan(2);
            q.ok(true);

            setTimeout(function () {
                q.ok(true);
            }, 100);
        });

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

    test('another', function (t) {
        t.plan(1);
        setTimeout(function () {
            t.ok(true);
        }, 50);
    });
});
