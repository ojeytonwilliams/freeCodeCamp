const inspect = require('unist-util-inspect');
const visit = require('unist-util-visit');
const toHast = require('mdast-util-to-hast');
var raw = require('hast-util-raw');
var findAndReplace = require('hast-util-find-and-replace');

function plugin() {
  return transformer;

  function transformer(tree) {
    visit(tree, 'html', visitor);

    function visitor(node) {
      // console.log('html node', node);

      const section = raw(toHast(node, { allowDangerousHTML: true }));

      console.log(inspect(section));
      findAndReplace(section, '\n', '\n\n');
      console.log(inspect(section));

      // TODO: insert a space a the start?  Or just do that via regex?
      // TODO: convert back to markdown and put it back in the tree.
    }
  }
}

module.exports = plugin;
