const unified = require('unified');
const vfile = require('to-vfile');
const markdown = require('remark-parse');
const frontmatter = require('remark-frontmatter');
const stringify = require('remark-stringify');

const insertSpaces = require('./insert-spaces');
const codeToBackticks = require('./code-to-backticks');

const processor = unified()
  .use(markdown)
  .use(insertSpaces)
  .use(stringify, { fences: true })
  .use(frontmatter, ['yaml']);
// ^ Prevents the frontmatter being modified

// TODO: either the processor or the prettifier (or both) is converting
// characters into html entities.
// TODO: they are also making links inside <code> blocks into clickable links
// via angle brackets!
// UPDATE: turns out that links inside <code> blocks are converted into anchor
// elements... Not ideal!
const prettifier = unified()
  .use(markdown)
  .use(codeToBackticks)
  .use(stringify, { fences: true })
  .use(frontmatter, ['yaml']);

exports.formatFile = function formatFile(filename) {
  return new Promise((resolve, reject) =>
    processor.process(vfile.readSync(filename), function(err, file) {
      if (err) {
        err.message += ' in file ' + filename;
        reject(err);
      }
      return resolve(file.contents);
    })
  );
};

exports.prettifyText = function prettifyText(text) {
  return new Promise((resolve, reject) =>
    prettifier.process(text, function(err, file) {
      if (err) {
        err.message += ' in file ' + text;
        reject(err);
      }
      return resolve(file.contents);
    })
  );
};
