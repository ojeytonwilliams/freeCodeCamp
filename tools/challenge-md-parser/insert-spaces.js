const visit = require('unist-util-visit');
const toHast = require('mdast-util-to-hast');
var raw = require('hast-util-raw');
var findAndReplace = require('hast-util-find-and-replace');
var toHtml = require('hast-util-to-html');

function plugin() {
  return transformer;

  function transformer(tree) {
    return visit(tree, 'html', visitor);

    function visitor(node) {
      const section = raw(toHast(node, { allowDangerousHTML: true }));
      // TODO: check that the section *doesn't* already have a blank line at the
      // start, otherwise this could mess up the formatting.
      if (
        section.type === 'element' &&
        (section.properties.id === 'instructions' ||
          section.properties.id === 'description')
      ) {
        console.log('section', section);
        findAndReplace(section, '\n', '\n\n');

        // This will be used, once, to convert old challenges to the new
        // format, so it's not as dangerous as it sounds.
        const sectionStr = toHtml(section, {
          allowDangerousCharacters: true,
          allowDangerousHTML: true,
          quote: "'"
        });
        node.value = sectionStr;
      }
    }
  }
}

module.exports = plugin;
