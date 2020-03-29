const args = require('./lib/args');
const fs = require('fs-extra');
const { watch, series } = require('gulp');

function copyDependencies(cb) {
  fs.ensureDirSync(`dist/${args.vendor}/dependencies/`);
  fs.copySync('node_modules/@popperjs/core/dist/umd/popper.js', `dist/${args.vendor}/dependencies/popper.js`);
  fs.copySync('node_modules/tippy.js/dist/tippy-bundle.umd.js', `dist/${args.vendor}/dependencies/tippy-bundle.umd.js`);
  fs.copySync('node_modules/tippy.js/themes/light.css', `dist/${args.vendor}/dependencies/light.css`);
  if (args.vendor === 'chrome') {
    fs.copySync('node_modules/webextension-polyfill/dist/browser-polyfill.js', `dist/${args.vendor}/dependencies/browser-polyfill.js`);
    fs.copySync('node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js', `dist/${args.vendor}/dependencies/webcomponents-bundle.js`);
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
  if (args.production) {
    let packageJson = fs.readJsonSync('package.json');
    manifest = Object.assign({}, manifest, { version: packageJson.version });
  } else {
    manifest = Object.assign({}, manifest, { version: '0.0.0' });
  }
  if (args.verbose) {
    console.log(JSON.stringify(manifest, null, 2));
  }
  fs.writeJsonSync(distManifestPath, manifest, { spaces: 4 });
  if (cb) {
    cb();
  }
}

function noManifests(fileName) {
  const include = fileName.indexOf('src/manifest.') === -1;
  return include;
}

function copySrc(cb) {
  fs.copySync('src', `dist/${args.vendor}/`,
    { filter: noManifests });
  if (cb) {
    cb();
  }
}

function copy(cb) {
  copyDependencies();
  copyManifest();
  copySrc();
  if (args.watch) {
    watch(['package.json', 'src/**/*.*'],
      series(copyDependencies, copySrc, copyManifest));
  }
  cb();
}

module.exports = copy;