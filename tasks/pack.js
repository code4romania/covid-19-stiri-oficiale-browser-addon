const args = require('./lib/args');
var spawn = require('child_process').spawn;

function pack(cb) {
  var cmd = spawn('node_modules/web-ext/bin/web-ext',
    ['build', `--source-dir=dist/${args.vendor}`, `--artifacts-dir=dist/package_${args.vendor}`],
    { stdio: 'inherit' });
  cmd.on('close', function (code) {
    cb(code);
  });
}

module.exports = pack;