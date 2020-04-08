const args = require('./lib/args');
const fs = require('fs-extra');
const { watch, series } = require('gulp');
const path = require('path');
const lint = require('./lint');

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
const vendorManifestPath = path.join('src', `manifest.${args.vendor}.json`);
const distManifestPath = path.join('dist', args.vendor, 'manifest.json');
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
    console.log(`Writing ${distManifestPath} with content:`);
    console.log(JSON.stringify(manifest, null, 2));
  }
  fs.writeJsonSync(distManifestPath, manifest, { spaces: 4 });
  if (cb) {
    cb();
  }
}

function noManifests(fileName) {
  return fileName.indexOf('manifest.') === -1;
}

function copySrc(cb) {
  fs.copySync('src', `dist/${args.vendor}/`,
    { filter: noManifests });
  if (cb) {
    cb();
  }
}

function copy(cb) {
  const steps = series(lint, copyDependencies, copySrc, copyManifest);
  if (args.watch) {
    steps();
    watch(['package.json', 'src/**/*.*'],
      steps);
  } else {
    steps();
  }
  cb();
}

module.exports = copy;