// TODO: because remark needs the filename passing in twice, we need to use
// the js config.  In order to get 'git add' to work, I needed to upgrade to the
// beta... which does includes it automatically.
// The js config is considerably more verbose, though, so it would be nicer
// if remark would play ball and accept a single filename argument.
// Is there some bash trickery that can achieve this and will it be cross
// platform?  Or do we just accept the verbosity?
module.exports = {
  './curriculum/challenges/**/*.md': filenames =>
    filenames.map(file => `remark ${file} -o ${file}`),
  '*.js': filenames => filenames.map(file => `eslint --fix ${file}`),
  '*.css': filenames => filenames.map(file => `prettier--fix ${file}`)
};
