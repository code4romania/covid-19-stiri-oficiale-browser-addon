const { series } = require('gulp');
const del = require('del');
var requireDir = require('require-dir');
const tasks = requireDir('./tasks');

function build(cb) {
    cb();
}

Object.keys(tasks).forEach((key) => {
    exports[key] = tasks[key].default;
});
exports.build = build;
exports.default = series(exports.clean, build);
