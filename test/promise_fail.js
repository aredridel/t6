import tape from 'tape';
import path from 'path';
import { spawn } from 'child_process';
import concat from 'concat-stream';
import url from "url";
const __dirname = url.fileURLToPath(url.resolve(import.meta.url, '.'));

import { stripFullStack } from './common.js';

tape.test('callback returning rejected promise should cause that test (and only that test) to fail', function (tt) {
    tt.plan(1);

    var ps = spawn(process.execPath, [path.join(__dirname, 'promises', 'fail.js')]);

    ps.stdout.pipe(concat(function (rows) {
        var rowsString = rows.toString('utf8');

        if (/^skip\n$/.test(rowsString)) {
            return tt.pass('the test file indicated it should be skipped');
        }

        let strippedString = stripFullStack(rowsString);

        // hack for consistency across all versions of node
        // some versions produce a longer stack trace for some reason
        // since this doesn't affect the validity of the test, the extra line is removed if present
        // the regex just removes the lines "at <anonymous>" and "[... stack stripped ...]" if they occur together
        strippedString = strippedString.replace(/.+at <anonymous>\n.+\[\.\.\. stack stripped \.\.\.\]\n/, '');

        tt.same(strippedString, [
            'TAP version 13',
            '# promise',
            'not ok 1 Error: rejection message',
            '  ---',
            '    operator: fail',
            '    stack: |-',
            '      Error: Error: rejection message',
            '          [... stack stripped ...]',
            '          at $TAPE/lib/test.js:$LINE:$COL',
            '          [... stack stripped ...]',
            '  ...',
            '# after',
            'ok 2 should be truthy',
            '',
            '1..2',
            '# tests 2',
            '# pass  1',
            '# fail  1',
            '',
            ''
        ].join('\n'));
    }));
});

tape.test('subtest callback returning rejected promise should cause that subtest (and only that subtest) to fail', function (tt) {
    tt.plan(1);

    var ps = spawn(process.execPath, [path.join(__dirname, 'promises', 'subTests.js')]);

    ps.stdout.pipe(concat(function (rows) {
        var rowsString = rows.toString('utf8');

        if (/^skip\n$/.test(rowsString)) {
            return tt.pass('the test file indicated it should be skipped');
        }

        let strippedString = stripFullStack(rowsString);

        // hack for consistency across all versions of node
        // some versions produce a longer stack trace for some reason
        // since this doesn't affect the validity of the test, the extra line is removed if present
        // the regex just removes the lines "at <anonymous>" and "[... stack stripped ...]" if they occur together
        strippedString = strippedString.replace(/.+at <anonymous>\n.+\[\.\.\. stack stripped \.\.\.\]\n/, '');

        tt.same(strippedString, [
            'TAP version 13',
            '# promise',
            '# sub test that should fail',
            'not ok 1 Error: rejection message',
            '  ---',
            '    operator: fail',
            '    stack: |-',
            '      Error: Error: rejection message',
            '          [... stack stripped ...]',
            '          at $TAPE/lib/test.js:$LINE:$COL',
            '          [... stack stripped ...]',
            '  ...',
            '# sub test that should pass',
            'ok 2 should be truthy',
            '',
            '1..2',
            '# tests 2',
            '# pass  1',
            '# fail  1',
            '',
            ''
        ].join('\n'));
    }));
});
