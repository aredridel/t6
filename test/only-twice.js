import { createHarness } from '../index.js';
import tap from 'tap';

tap.test('only twice error', function (assert) {
    var test = createHarness({ exit: false });

    test.only("first only", function (t) {
        t.end();
    });

    assert.throws(function () {
        test.only('second only', function (t) {
            t.end();
        });
    }, {
        name: 'Error',
        message: 'there can only be one only test'
    });
    assert.end();
});
