import { spawn } from 'child_process';
import path from 'path';
import url from "url";
const __dirname = url.fileURLToPath(url.resolve(import.meta.url, '.'));

var ps = spawn(process.execPath, [path.join(__dirname, 'max_listeners', 'source.js')]);

ps.stdout.pipe(process.stdout, { end: false });

ps.stderr.on('data', function (buf) {
    if (!/ExperimentalWarning/.test(buf)) console.log('not ok ' + buf);
});
