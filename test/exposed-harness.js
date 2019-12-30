import { getHarness } from '../index.js';
import tape from 'tape';

tape.test('main harness object is exposed', function (assert) {

    assert.equal(typeof getHarness, 'function', 'tape.getHarness is a function');

    assert.equal(getHarness()._results.pass, 0);

    assert.end();

});
