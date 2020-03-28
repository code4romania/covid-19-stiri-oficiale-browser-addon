const args = require('./lib/args');
const fs = require('fs-extra');

const manifestFiles = {
    'firefox': 'manifest_firefox.json',
    'android': 'manifest_firefox.json',
    'chrome': 'manifest_chrome.json'
};

function copy(cb) {
  fs.ensureDirSync(`dist/${args.vendor}/dependencies/`);
  fs.copySync('node_modules/@popperjs/core/dist/umd/popper.js', `dist/${args.vendor}/dependencies/popper.js`);
  fs.copySync('node_modules/tippy.js/dist/tippy-bundle.umd.js', `dist/${args.vendor}/dependencies/tippy-bundle.umd.js`);
  fs.copySync('node_modules/tippy.js/themes/light.css', `dist/${args.vendor}/dependencies/light.css`);
  if (args.vendor === 'chrome') {
    fs.copySync('node_modules/webextension-polyfill/dist/browser-polyfill.js', `dist/${args.vendor}/dependencies/browser-polyfill.js`);
  }
  fs.copySync('src', `dist/${args.vendor}/`);
  const manifest = manifestFiles[args.vendor];
  fs.copySync(`${manifest}`, `dist/${args.vendor}/manifest.json`);
  cb();
}

module.exports = copy;