const args = require('./lib/args');
const fs = require('fs-extra');
const { watch, series } = require('gulp');
const lintSrc = require('./lintSrc');
const concatBackground = require('./concatBackground');
const concatContent = require('./concatContent');
const copyNodeModules = require('./copyNodeModules');
const copyManifest = require('./copyManifest');

function ignoredFiles(fileName) {
  return fileName.indexOf('manifest.') === -1 &&
    fileName.indexOf('src/background') === -1 &&
    fileName.indexOf('src/content') === -1 &&
    fileName.indexOf('src/terms.json') === -1 &&
    fileName.indexOf('src/config.json') === -1;
}

function copySrc(cb) {
  fs.copySync('src', `dist/${args.vendor}/`,
    { filter: ignoredFiles });
  if (cb) {
    cb();
  }
}

function copy(cb) {
  const steps = series(lintSrc, copyNodeModules, copySrc, concatBackground, concatContent, copyManifest);
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