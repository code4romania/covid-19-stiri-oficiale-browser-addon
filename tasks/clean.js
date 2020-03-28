const del = require('del');
const args = require('./lib/args');

function clean(cb) {
  return del(`dist/${args.vendor}/**/*`)
  cb();
}

module.exports = clean;