const args = require('./lib/args');
const spawn = require('child_process').spawn;

const webExtTarget = [];
webExtTarget.firefox = 'firefox-desktop';
webExtTarget.android = 'firefox-android';
webExtTarget.chrome = 'chromium';

function webextrun(cb) {
  const target = webExtTarget[args.vendor];
  const cmd = spawn('node', ['node_modules/web-ext/bin/web-ext', 'run', '-t', `${target}`, '-s', `dist/${args.vendor}`, '--config', `${args.vendor}.config.js`], {stdio: 'inherit'});
  cmd.on('close', function (code) {
    cb(code);
  });
}

module.exports = webextrun;