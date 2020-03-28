const { series } = require('gulp');
const del = require('del');
var requireDir = require('require-dir');
const tasks = requireDir('./tasks');

function build(cb) {
    cb();
}

exports.clean = tasks.clean.clean;
exports.build = build;
exports.default = series(tasks.clean.clean, build);
