import { createHarness, default as test } from '../index.js';
import concat from 'concat-stream';
import tape from 'tape';

var ran = 0;

tape.test('test SKIP comment', function (assert) {
    assert.plan(1);

    var verify = function (output) {
        assert.equal(output.toString('utf8'), [
            'TAP version 13',
            '# SKIP skipped',
            '',
            '1..0',
            '# tests 0',
            '# pass  0',
            '',
            '# ok',
            ''
        ].join('\n'));
    };

    var tapeTest = createHarness();
    tapeTest.createStream().pipe(concat(verify));
    tapeTest('skipped', { skip: true }, function (t) {
        t.end();
    });
});

test('skip this', { skip: true }, function (t) {
    t.fail('this should not even run');
    ran++;
    t.end();
});

test.skip('skip this too', function (t) {
    t.fail('this should not even run');
    ran++;
    t.end();
});

test('skip subtest', function (t) {
    ran++;
    t.test('skip this', { skip: true }, function (t) {
        t.fail('this should not even run');
        t.end();
    });
    t.end();
});

// vim: set softtabstop=4 shiftwidth=4:
