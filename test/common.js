import path from 'path';
import { spawn } from 'child_process';
import concat from 'concat-stream';
import yaml from 'js-yaml';
import url from 'url';

const __dirname = url.fileURLToPath(url.resolve(import.meta.url, '.'));

export function getDiag(body) {
    var yamlStart = body.indexOf('  ---');
    var yamlEnd = body.indexOf('  ...\n');
    var diag = body.slice(yamlStart, yamlEnd).split('\n').map(function (line) {
        return line.slice(2);
    }).join('\n');

    // The stack trace and at variable will vary depending on where the code
    // is run, so just strip it out.
    var withStack = yaml.safeLoad(diag);
    delete withStack.stack;
    delete withStack.at;
    return withStack;
};

// There are three challenges associated with checking the stack traces included
// in errors:
// 1) The base checkout directory of tape might change. Because stack traces
//    include absolute paths, the stack traces will change depending on the
//    checkout path. We handle this by replacing the base test directory with a
//    placeholder $TEST variable and the package root with a placehodler
//    $TAPE variable.
// 2) Line positions within the file might change. We handle this by replacing
//    line and column markers with placeholder $LINE and $COL "variables"
//   a) node 0.8 does not provide nested eval line numbers, so we remove them
// 3) Stacks themselves change frequently with refactoring. We've even run into
//    issues with node library refactorings "breaking" stack traces. Most of
//    these changes are irrelevant to the tests themselves. To counter this, we
//    strip out all stack frames that aren't directly under our test directory,
//    and replace them with placeholders.

var stripChangingData = function (line) {
    var withoutTestDir = line.replace(url.resolve(import.meta.url, '.'), '$TEST/');
    var withoutPackageDir = withoutTestDir.replace(url.resolve(import.meta.url, '..'), '$TAPE/');
    var withoutPathSep = withoutPackageDir.replace(new RegExp('\\' + path.sep, 'g'), '/');
    var withoutLineNumbers = withoutPathSep.replace(/:\d+:\d+/g, ':$LINE:$COL');
    var withoutNestedLineNumbers = withoutLineNumbers.replace(/, \<anonymous\>:\$LINE:\$COL\)$/, ')');
    return withoutNestedLineNumbers;
};

export function stripFullStack(output) {
    var stripped = '          [... stack stripped ...]';
    var withDuplicates = output.split('\n').map(stripChangingData).map(function (line) {
        var m = line.match(/[ ]{8}at .*\((.*)\)/);

        if (m && m[1].slice(0, 5) !== '$TEST') {
            return stripped;
        }
        return line;
    });

    var deduped = withDuplicates.filter(function (line, ix) {
        var hasPrior = line === stripped && withDuplicates[ix - 1] === stripped;
        return !hasPrior;
    });

    return deduped.join('\n').replace(
        // Handle stack trace variation in Node v0.8
        /at(:?) Test\.(?:module\.exports|tap\.test\.err\.code)/g,
        'at$1 Test.<anonymous>'
    );
};

export function runProgram(folderName, fileName, cb) {
    var result = {
        stdout: null,
        stderr: null,
        exitCode: 0
    };
    var ps = spawn(process.execPath, [
        path.join(__dirname, folderName, fileName)
    ]);

    ps.stdout.pipe(concat(function (stdoutRows) {
        result.stdout = stdoutRows;
    }));
    ps.stderr.pipe(concat(function (stderrRows) {
        if (stderrRows) {
            result.stderr = stderrRows.toString().replace(/^.*ExperimentalWarning.*$\n/m, '');
        } else {
            result.stderr = '';
        }
    }));

    ps.on('exit', function (code) {
        result.exitCode = code;
        cb(result);
    });
};
