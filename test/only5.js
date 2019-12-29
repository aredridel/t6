import test from '../index.js';

test.only('only5 duplicate test name', function (t) {
    t.end();
});

test('only5 duplicate test name', function (t) {
    t.fail('not 2');
    t.end();
});
