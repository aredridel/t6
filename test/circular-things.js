import { createHarness} from '../index.js';
import tape from 'tape';
import concat from 'concat-stream';

import { stripFullStack } from './common.js';

tape.test('circular test', function (assert) {
    var test = createHarness({ exit: false });
    assert.plan(1);

    test.createStream().pipe(concat(function (body) {
        assert.equal(
            stripFullStack(body.toString('utf8')),
            'TAP version 13\n'
            + '# circular\n'
            + 'not ok 1 should be equal\n'
            + '  ---\n'
            + '    operator: equal\n'
            + '    expected: |-\n'
            + '      {}\n'
            + '    actual: |-\n'
            + '      { circular: [Circular] }\n'
            + '    at: Test.<anonymous> ($TEST/circular-things.js:$LINE:$COL)\n'
            + '    stack: |-\n'
            + '      Error: should be equal\n'
            + '          [... stack stripped ...]\n'
            + '          at Test.<anonymous> ($TEST/circular-things.js:$LINE:$COL)\n'
            + '          [... stack stripped ...]\n'
            + '  ...\n'
            + '\n'
            + '1..1\n'
            + '# tests 1\n'
            + '# pass  0\n'
            + '# fail  1\n'
        );
    }));

    test("circular", function (t) {
        t.plan(1);
        var circular = {};
        circular.circular = circular;
        t.equal(circular, {});
    });
});
