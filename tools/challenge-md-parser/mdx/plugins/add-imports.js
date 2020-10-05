const path = require('path');
const { read } = require('to-vfile');
const find = require('unist-util-find');
const modifyChildren = require('unist-util-modify-children');
const remark = require('remark');
// const mdx = require('remark-mdx');
const remove = require('unist-util-remove');
const visit = require('unist-util-visit');

const { editableRegionMarker } = require('./add-seed');

const importRE = /^import (\w*?) from '(.*?)';?$/;
const componentRE = /<\s*(\w*?)\s*\/>/;

// TODO: this won't handle embedded html properly, it'll assume it's jsx
// (because of use mdx). We could just remove that... or consider some
// kind of recursive import if we wanted to import mdx files that had their
// own imports.  Probably a terrible idea, though.
// NOTE: for now, I'll just comment out mdx.
async function parse(file) {
  return await remark()
    // .use(mdx)
    .parse(file);
}

function plugin() {
  return transformer;

  function transformer(tree, file, next) {
    const importedFiles = find(tree, { type: 'import' });
    if (!importedFiles) {
      next();
      return;
    }
    const importStrings = importedFiles.value.split('\n');
    const importPromises = importStrings.map(async toImport => {
      // TODO: make sure it is relative to the *importing* file, not the dir the
      // script is run from!
      const [, name, importedFilename] = toImport.match(importRE);
      const location = path.resolve(file.dirname, importedFilename);
      await read(location)
        .then(parse)
        .then(importedFile => {
          function modifier(node, index, parent) {
            // TODO: optional chaining
            const match = node.value ? node.value.match(componentRE) : null;
            if (node.type === 'jsx' && match && match[1] === name) {
              if (!validateImports(importedFile))
                throw Error(
                  'Importing files containing ' +
                    editableRegionMarker +
                    's is not supported.'
                );

              parent.children.splice(index, 1, ...importedFile.children);
            }
          }

          const modify = modifyChildren(modifier);
          modify(tree);
        });
    });
    // We're not interested in the results of importing, we just want to modify
    // the tree and pass that new tree to follow plugins - as a result, we can't
    // just use .then(next), as it would pass the array into next.  Also, we
    // remove the import statements here.
    Promise.all(importPromises)
      .then(() => {
        remove(tree, { type: 'import' });
        next();
      })
      .catch(next);
  }
}

function validateImports(fileTree) {
  let valid = true;

  function visitor({ value }) {
    if (value && value.includes(editableRegionMarker)) {
      valid = false;
      return visit.EXIT;
    } else {
      return visit.CONTINUE;
    }
  }

  visit(fileTree, visitor);
  return valid;
}

module.exports = plugin;
