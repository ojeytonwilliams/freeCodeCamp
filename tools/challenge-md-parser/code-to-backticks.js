const visit = require('unist-util-visit');
const toHast = require('mdast-util-to-hast');
const raw = require('hast-util-raw');
const toMdast = require('hast-util-to-mdast');
const toHtml = require('hast-util-to-html');
const inlineCode = require('hast-util-to-mdast/lib/handlers/inline-code');

function codeToInline(h, node) {
  if (node.children.length > 1) {
    console.log('Leaving code block as it does not just contain text');
    console.log(node);
    // throw Error('Too many children');
    return {
      type: 'html',
      value: toHtml(node, {
        allowDangerousCharacters: true,
        allowDangerousHTML: true,
        quote: "'"
      })
    };
  } else {
    return inlineCode(h, node);
  }
}

function plugin() {
  return transformer;

  function transformer(tree) {
    visit(tree, 'paragraph', visitor);

    function visitor(node, id, parent) {
      console.log('NODE', node); // HERE: it's already a link at this point.
      const paragraph = raw(toHast(node, { allowDangerousHTML: true }));
      console.log('PARAGRAPH', paragraph);
      parent.children[id] = toMdast(paragraph, {
        handlers: { code: codeToInline }
      });
    }
  }
}

module.exports = plugin;
