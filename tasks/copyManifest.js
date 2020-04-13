const args = require('./lib/args');
const fs = require('fs-extra');
const path = require('path');

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

module.exports = copyManifest;