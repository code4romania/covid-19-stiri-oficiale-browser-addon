const { src } = require('gulp');
const eslint = require('gulp-eslint');

function lintSrc() {
  return src(['src/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

module.exports = lintSrc;