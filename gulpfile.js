const { series } = require('gulp');
const del = require('del');
var requireDir = require('require-dir');
const tasks = requireDir('./tasks');

Object.keys(tasks).forEach((key) => {
    exports[key] = tasks[key];
});

exports.build = series(exports.clean, exports.copy, exports.package);
exports.default = series(exports.clean, exports.copy, exports.watch);
