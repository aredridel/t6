import test from "../../index.js";

test('todo fail', { todo: true }, function (t) {
    t.plan(1);
    t.ok(false);
});
