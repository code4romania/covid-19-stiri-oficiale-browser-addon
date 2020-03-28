const del = require('del');
const args = require('./lib/args');

function clean(cb) {
  console.log('Deleting dist/' + args.vendor);
  return del(`dist/${args.vendor}/**/*`)
  cb();
}

exports.default = clean;