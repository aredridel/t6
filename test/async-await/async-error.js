import test from '../../index.js';

test('async-error', async function myTest(t) {
    t.ok(true, 'before throw');
    throw new Error('oopsie');
    t.ok(true, 'after throw');
});
