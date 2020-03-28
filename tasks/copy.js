const args = require('./lib/args');
const fs = require('fs-extra');
const { watch, series } = require('gulp');

const manifestFiles = {
  'firefox': 'manifest_firefox.json',
  'android': 'manifest_firefox.json',
  'chrome': 'manifest_chrome.json'
};
const manifest = manifestFiles[args.vendor];

function copyDependencies(cb) {
  fs.ensureDirSync(`dist/${args.vendor}/dependencies/`);
  fs.copySync('node_modules/@popperjs/core/dist/umd/popper.js', `dist/${args.vendor}/dependencies/popper.js`);
  fs.copySync('node_modules/tippy.js/dist/tippy-bundle.umd.js', `dist/${args.vendor}/dependencies/tippy-bundle.umd.js`);
  fs.copySync('node_modules/tippy.js/themes/light.css', `dist/${args.vendor}/dependencies/light.css`);
  if (args.vendor === 'chrome') {
    fs.copySync('node_modules/webextension-polyfill/dist/browser-polyfill.js', `dist/${args.vendor}/dependencies/browser-polyfill.js`);
  }
  if (cb) {
    cb();
  }
}

function copyManifest(cb) {
  fs.copySync(`${manifest}`, `dist/${args.vendor}/manifest.json`);
  if (cb) {
    cb();
  }
}

function copySrc(cb) {
  fs.copySync('src', `dist/${args.vendor}/`);
  if (cb) {
    cb();
  }
}

function copy(cb) {
  copyDependencies();
  copyManifest();
  copySrc();
  watch('package*.json', copyDependencies);
  watch(`${manifest}`, copyManifest);
  watch('src/**/*.*', copySrc);
  cb();
}

module.exports = copy;