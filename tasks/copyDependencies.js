const args = require('./lib/args');
const fs = require('fs-extra');

function copyDependencies(cb) {
  fs.ensureDirSync(`dist/${args.vendor}/dependencies/`);
  fs.copySync('node_modules/@popperjs/core/dist/umd/popper.js', `dist/${args.vendor}/dependencies/popper.js`);
  fs.copySync('node_modules/tippy.js/dist/tippy-bundle.umd.js', `dist/${args.vendor}/dependencies/tippy-bundle.umd.js`);
  fs.copySync('node_modules/tippy.js/themes/light.css', `dist/${args.vendor}/dependencies/light.css`);
  fs.copySync('node_modules/echarts/dist/echarts.js', `dist/${args.vendor}/dependencies/echarts.js`);
  if (args.vendor === 'firefox' || args.vendor === 'android') {
    fs.copySync('package.json', `dist/${args.vendor}/dependencies/package.json`);
    fs.copySync('package-lock.json', `dist/${args.vendor}/dependencies/package-lock.json`);
  }
  if (args.vendor === 'chrome') {
    fs.copySync('node_modules/webextension-polyfill/dist/browser-polyfill.js', `dist/${args.vendor}/dependencies/browser-polyfill.js`);
    fs.copySync('node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js', `dist/${args.vendor}/dependencies/webcomponents-bundle.js`);
  }
  if (cb) {
    cb();
  }
}

module.exports = copyDependencies;