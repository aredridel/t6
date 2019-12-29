import test from "../../index.js";

test('todo pass', { todo: true }, function (t) {
    t.plan(1);
    t.ok(true);
});
