const unified = require('unified');
const vfile = require('to-vfile');
const markdown = require('remark-parse');
const md = require('remark-stringify');

const insertSpaces = require('./insert-spaces');

const processor = unified()
  .use(markdown)
  .use(insertSpaces)
  .use(md);
// TODO: the frontmatter should keep the -s, not use *

exports.parseMarkdown = function parseMarkdown(filename) {
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
