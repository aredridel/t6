import tape from 'tape';
import { spawn } from 'child_process';
import concat from 'concat-stream';
import url from "url";
import path from "path";

tape.test('requiring a single module', function (t) {
    t.plan(2);

    var tc = function (rows) {
        t.same(rows.toString('utf8'), [
            'TAP version 13',
            '# module-a',
            'ok 1 loaded module a',
            '# test-a',
            'ok 2 module-a loaded in same context',
            'ok 3 test ran after module-a was loaded',
            '',
            '1..3',
            '# tests 3',
            '# pass  3',
            '',
            '# ok'
        ].join('\n') + '\n\n');
    };

    var ps = t6('-r ./require/a require/test-a.js');
    ps.stdout.pipe(concat(tc));
    ps.on('exit', function (code) {
        t.equal(code, 0);
    });
});

tape.test('requiring multiple modules', function (t) {
    t.plan(2);

    var tc = function (rows) {
        t.same(rows.toString('utf8'), [
            'TAP version 13',
            '# module-a',
            'ok 1 loaded module a',
            '# module-b',
            'ok 2 loaded module b',
            '# test-a',
            'ok 3 module-a loaded in same context',
            'ok 4 test ran after module-a was loaded',
            '# test-b',
            'ok 5 module-b loaded in same context',
            'ok 6 test ran after module-b was loaded',
            '',
            '1..6',
            '# tests 6',
            '# pass  6',
            '',
            '# ok'
        ].join('\n') + '\n\n');
    };

    var ps = t6('-r ./require/a -r ./require/b require/test-a.js require/test-b.js');
    ps.stdout.pipe(concat(tc));
    ps.on('exit', function (code) {
        t.equal(code, 0);
    });
});

function t6(args) {
    const bin = path.resolve(url.fileURLToPath(import.meta.url), '../../bin/t6');
    const dir = path.resolve(url.fileURLToPath(import.meta.url), '../');

    return spawn('node', [bin].concat(args.split(' ')), { cwd: dir });
}
