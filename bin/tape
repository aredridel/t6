#!/usr/bin/env node

import resolveModule from 'resolve';
import { resolve as resolvePath } from 'path';
import parseOpts from 'minimist';
import glob from 'glob';
import am from "am";

import { getHarness } from "../index.js";

am(async () => {
    var opts = parseOpts(process.argv.slice(2), {
        alias: { r: 'require' },
        string: 'require',
        default: { r: [] }
    });

    var cwd = process.cwd();

    if (typeof opts.require === 'string') {
        opts.require = [opts.require];
    }

    const harness = getHarness();
    harness._results._holdDone();

    for (const module of opts.require) {
        var options  = { basedir: cwd, extensions: ['.js', '.mjs', '.cjs', '.json', '.node'] };
        if (module) {
            /* This check ensures we ignore `-r ""`, trailing `-r`, or
             * other silly things the user might (inadvertently) be doing.
             */
            await import(resolveModule.sync(module, options));
        }
    }

    for (const arg of opts._) {
        // If glob does not match, `files` will be an empty array.
        // Note: `glob.sync` may throw an error and crash the node process.
        var files = glob.sync(arg);

        if (!Array.isArray(files)) {
            throw new TypeError('unknown error: glob.sync did not return an array or throw. Please report this.');
        }

        for (const file of files) {
            await import(resolvePath(cwd, file));
        }
    }

    harness._results.run();
    harness._results._releaseDone();
});

// vim: ft=javascript
