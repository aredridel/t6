import test from "../../index.js";

test('double end', function (t) {
    function doEnd() {
        t.end();
    }

    t.equal(1 + 1, 2);
    t.end();
    setTimeout(doEnd, 5);
});
