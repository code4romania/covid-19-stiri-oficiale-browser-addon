const args = require('./lib/args');
var spawn = require('child_process').spawn;

const webExtTarget = [];
webExtTarget['firefox'] = 'firefox-desktop';
webExtTarget['android'] = 'firefox-android';
webExtTarget['chrome'] = 'chromium';

function watch(cb) {
  const target = webExtTarget[args.vendor];
  var cmd = spawn('node_modules/web-ext/bin/web-ext', ['run', '-t', `${target}`, '-s', `dist/${args.vendor}`], {stdio: 'inherit'});
  cmd.on('close', function (code) {
    cb(code);
  });
}

module.exports = watch;