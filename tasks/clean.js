const del = require('del');
const args = require('./lib/args');

function clean() {
  const patternToDelete = `dist/${args.vendor}/**/*`;
  if(args.verbose){
    console.log(`Deleting ${patternToDelete}`);
  }
  return del(patternToDelete);
}

module.exports = clean;