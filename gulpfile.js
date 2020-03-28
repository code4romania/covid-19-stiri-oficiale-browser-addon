const { series } = require('gulp');
const del = require('del');

function clean(cb) {
    del(`dist/firefox/**/*`)
    cb();
}

function build(cb) {
    cb();
}

exports.clean = clean;
exports.build = build;
exports.default = series(clean, build);