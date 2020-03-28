const yargs = require('yargs');

const args = yargs
  .option('watch', {
    boolean: true,
    default: false,
    describe: 'Watch all files and start a livereload server'
  })
  .option('verbose', {
    boolean: true,
    default: false,
    describe: 'Log additional data'
  })
  .option('vendor', {
    string: true,
    default: 'firefox',
    describe: 'Compile the extension for different vendors',
    choices: ['chrome', 'firefox', 'android']
  })
  .argv

module.exports = args;