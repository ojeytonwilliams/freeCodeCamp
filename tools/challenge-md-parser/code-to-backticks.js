const visit = require('unist-util-visit');
const toHast = require('mdast-util-to-hast');
const raw = require('hast-util-raw');

function codeToInline(node) {
  if (node.children.length > 1) {
    console.log('Leaving code block as it does not just contain text');
    // throw Error(); // here if you want to see which file has the problem.
    return node;
  } else if (node.children.length === 0) {
    // chances are the original challenge has a mistake, as it's an empty code
    // block: <code></code>, but in the interests of keeping the formatting
    // unchanged, this recreates that using backticks.
    return { type: 'inlineCode', value: '' };
  }

  const text = node.children[0].value;
  if (/``/.test(text)) {
    throw Error('Cannot handle code with two backticks yet');
  }
  return { type: 'inlineCode', value: text };
}

function plugin() {
  return transformer;

  function transformer(tree) {
    return visit(tree, 'paragraph', visitor);

    function codeVisitor(node, id, parent) {
      parent.children[id] = codeToInline(node);
    }

    function visitor(node) {
      const paragraph = raw(toHast(node, { allowDangerousHTML: true }));
      visit(
        paragraph,
        node => node.type === 'element' && node.tagName === 'code',
        codeVisitor
      );

      node.children = paragraph.children;
    }
  }
}

module.exports = plugin;
