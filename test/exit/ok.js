import test from "../../index.js";

test('array', function (t) {
    t.comment('hi');
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
            t.same(xs, [ [ 1, 2, [ 3, 4 ] ], [ 5, 6 ] ]);
        }
    );
});
