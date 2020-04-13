const { src } = require('gulp');
const eslint = require('gulp-eslint');
const args = require('./lib/args');

function lintDist() {
  return src([`dist/${args.vendor}/**/*.js`], { ignore: `dist/${args.vendor}/node_modules/**/*.js` })
    .pipe(eslint({
      rules: {
        "no-unused-vars": ["error", { "vars": "local", "args": "after-used", "ignoreRestSiblings": false }]
      },
      envs: [
        'browser'
      ]
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

module.exports = lintDist;