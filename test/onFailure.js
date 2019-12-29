import tap from "tap";
import { createHarness, createStream } from "../index.js";

tap.test("on failure", { timeout: 1000 }, function (tt) {
    tt.plan(1);

    //Because this test passing depends on a failure,
    //we must direct the failing output of the inner test
    var noop = function () {};
    var mockSink = {on: noop, removeListener: noop, emit: noop, end: noop};
    const tape = createHarness();
    tape.createStream().pipe(mockSink);

    tape("dummy test", function (t) {
        t.fail();
        t.end();
    });

    tape.onFailure(function () {
        tt.pass("tape ended");
    });
});
