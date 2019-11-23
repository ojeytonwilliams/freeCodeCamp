const unified = require('unified');
const vfile = require('to-vfile');
const markdown = require('remark-parse');
const frontmatter = require('remark-frontmatter');
const stringify = require('remark-stringify');

const insertSpaces = require('./insert-spaces');
const codeToBackticks = require('./code-to-backticks');

const insertSpacesProcessor = unified()
  .use(markdown)
  .use(insertSpaces)
  .use(stringify, { fences: true })
  .use(frontmatter, ['yaml']);
// ^ Prevents the frontmatter being modified

// TODO: they are also making links inside <code> blocks into clickable links
// via angle brackets!

// TODO: how do we tell if text in the first paragraph of section (i.e. the code
// that's currently treated differently by the fcc parser) has markdown inside
// it?  i.e. imagine we have
//

/*
  <em>Em</em> or *em*?

*/

// The fcc parser will use the tags to create italics, but leave the stars in.
// Is there an mdast raw equivalent?  i.e. please don't process this!

const codeToBackticksProcessor = unified()
  .use(markdown)
  .use(codeToBackticks)
  .use(stringify, { fences: true })
  .use(frontmatter, ['yaml']);

exports.insertSpaces = createProcessor(insertSpacesProcessor);

exports.codeToBackticks = createProcessor(codeToBackticksProcessor);

function createProcessor(processor) {
  return (msg, isFile = false) => {
    const fileOrText = isFile ? vfile.readSync(msg) : msg;
    return new Promise((resolve, reject) =>
      processor.process(fileOrText, function(err, file) {
        if (err) {
          err.message += ' in file ' + msg;
          reject(err);
        }
        return resolve(file.contents);
      })
    );
  };
}
