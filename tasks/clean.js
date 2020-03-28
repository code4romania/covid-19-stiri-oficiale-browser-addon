const del = require('del');

function clean(cb) {
  del(`dist/**/*`)
  cb();
}

exports.clean = clean;
