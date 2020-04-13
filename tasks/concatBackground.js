const args = require('./lib/args');
const { src, dest } = require('gulp');
const concat = require('gulp-concat');

function concatBackground(cb) {
  src('src/background/**/*.js')
    .pipe(concat('background.js'))
    .pipe(dest(`dist/${args.vendor}`));
  if (cb) {
    cb();
  }
}

module.exports = concatBackground;