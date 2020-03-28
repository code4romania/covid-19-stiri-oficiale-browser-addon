const args = require('./lib/args');
const fs = require('fs-extra');
const { watch } = require('gulp');

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
const vendorManifestPath = `src/manifest.${args.vendor}.json`;
const distManifestPath = `dist/${args.vendor}/manifest.json`;
function copyManifest(cb) {
  let manifest = fs.readJsonSync('src/manifest.json');
  if (fs.existsSync(vendorManifestPath)) {
    const vendorManifest = fs.readJsonSync(vendorManifestPath);
    manifest = Object.assign({}, manifest, vendorManifest);
  }
  fs.writeJsonSync(distManifestPath, manifest, { spaces: 4 });
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
  if (args.watch) {
    const manifests = ['src/manifest.json', `${vendorManifestPath}`];
    watch('package.json', copyDependencies);
    watch('src/**/*.*', { ignored: manifests }, copySrc);
    watch(manifests, copyManifest);
  }
  cb();
}

module.exports = copy;