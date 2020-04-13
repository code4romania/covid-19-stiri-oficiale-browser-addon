const args = require('./lib/args');
const { src, dest } = require('gulp');
const concat = require('gulp-concat');
var insert = require('gulp-insert');

function concatContent(cb) {
  src('src/content/**/*.js')
    .pipe(insert.transform(function (contents, file) {
      return `//------------------------------\n// ${file.path.split("src/")[1]}\n//------------------------------\n\n${contents}\n`;
    }))
    .pipe(concat('content.js'))
    .pipe(dest(`dist/${args.vendor}`));
  if (cb) {
    cb();
  }
}

module.exports = concatContent;