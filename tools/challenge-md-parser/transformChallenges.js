const unified = require('unified');
const vfile = require('to-vfile');
const markdown = require('remark-parse');
const frontmatter = require('remark-frontmatter');
const stringify = require('remark-stringify');

const insertSpaces = require('./insert-spaces');

const processor = unified()
  .use(markdown)
  .use(insertSpaces)
  .use(stringify, { fences: true })
  .use(frontmatter, ['yaml']);
// ^ Prevents the frontmatter being modified

exports.formatMarkdown = function formatMarkdown(filename) {
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
