const args = require('./lib/args');
const fs = require('fs-extra');

function copyNodeModules(cb) {
  fs.ensureDirSync(`dist/${args.vendor}/node_modules/`);
  fs.copySync('node_modules/@popperjs/core/dist/umd/popper.js', `dist/${args.vendor}/node_modules/popper.js`);
  fs.copySync('node_modules/tippy.js/dist/tippy-bundle.umd.js', `dist/${args.vendor}/node_modules/tippy-bundle.umd.js`);
  fs.copySync('node_modules/tippy.js/themes/light.css', `dist/${args.vendor}/node_modules/light.css`);
  fs.copySync('node_modules/echarts/dist/echarts.js', `dist/${args.vendor}/node_modules/echarts.js`);
  if (args.vendor === 'firefox' || args.vendor === 'android') {
    fs.copySync('package.json', `dist/${args.vendor}/node_modules/package.json`);
    fs.copySync('package-lock.json', `dist/${args.vendor}/node_modules/package-lock.json`);
  }
  if (args.vendor === 'chrome') {
    fs.copySync('node_modules/webextension-polyfill/dist/browser-polyfill.js', `dist/${args.vendor}/node_modules/browser-polyfill.js`);
    fs.copySync('node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js', `dist/${args.vendor}/node_modules/webcomponents-bundle.js`);
  }
  if (cb) {
    cb();
  }
}

module.exports = copyNodeModules;