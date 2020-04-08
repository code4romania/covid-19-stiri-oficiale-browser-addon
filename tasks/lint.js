const { src } = require('gulp');
const eslint = require('gulp-eslint');

function lint() {
  return src(['src/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

module.exports = lint;