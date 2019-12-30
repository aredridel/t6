import tape from 'tape';
import t6 from "../index.js";

tape.test("on finish", {timeout: 1000}, function (tt) {
    tt.plan(1);
    t6.onFinish(function () {
        tt.pass('tape ended');
    });
    tape('dummy test', function (t) {
        t.end();
    });
});
