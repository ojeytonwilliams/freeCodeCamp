const visit = require('unist-util-visit');
const toHast = require('mdast-util-to-hast');
const raw = require('hast-util-raw');
const findAndReplace = require('hast-util-find-and-replace');
const toHtml = require('hast-util-to-html');
const isEmpty = require('lodash/isEmpty');

/* Currently the challenge parser behaves differently depending on whether a
section starts with an empty line or not.  If it does not, the parser interprets
single new-line (\n) characters as paragraph breaks.  It also does not parse
markdown syntax (such as `).  This makes formatting challenges harder than it
needs to be, since normal markdown rules do not apply (some of the time!)

For example
<section id='instructions'>
Sentence1.
Sentence2 `var x = 'y'`.
...

becomes


Sentence1.

Sentence2 `var x = 'y'`.


in the challenge, but should become


Sentence1. Sentence2 <code>var x = 'y'</code>.

---

This file converts the instructions and descriptions.  After this there will be
no need to handle the case where the first line is not empty and markdown syntax
will alway work.  The linter can check that the first blank line exists.
*/

function codeToBackticks(node) {
  if (node.children.length > 1) {
    console.log('Leaving code block as it does not just contain text');
    // throw Error(); // here if you want to see which file has the problem.
    return node;
  } else if (node.children.length === 0) {
    // chances are the original challenge has a mistake, as it's an empty code
    // block: <code></code>, but in the interests of keeping the formatting
    // unchanged, this recreates that using backticks.
    return { type: 'raw', value: '``' };
  }

  const text = node.children[0].value;
  const leftTick = /`/.test(text) ? '`` ' : '`';
  const rightTick = /`/.test(text) ? ' ``' : '`';
  if (/``/.test(text)) {
    throw Error('Cannot handle code with two backticks yet');
  }
  // has to be raw or the entities will get encoded.
  return { type: 'raw', value: leftTick + text + rightTick };
}

function plugin() {
  return transformer;

  function transformer(tree) {
    return visit(tree, 'html', visitor);

    function codeVisitor(node, id, parent) {
      parent.children[id] = codeToBackticks(node);
    }

    function visitor(node) {
      // 'html' nodes contain un-parsed html strings, so we first convert them
      // to hast and then parse them to produce a syntax tree (so we can locate
      // and modify the instructions and description)
      const section = raw(toHast(node, { allowDangerousHTML: true }));
      if (
        section.type === 'element' &&
        (section.properties.id === 'instructions' ||
          section.properties.id === 'description') &&
        !isEmpty(section.children)
      ) {
        // section contains the section tag and all the text up to the first
        // blank line.

        // Convert code tags to backticks, where possible.
        visit(
          section,
          node => node.type === 'element' && node.tagName === 'code',
          codeVisitor
        );

        // Next a newline needs inserting at the start, since this is needed
        // to ensure the text will be parsed as markdown.

        section.children.unshift({ type: 'text', value: '\n' });

        // This replaces single line breaks with empty lines, so
        // that the section text that previously required special treatment
        // becomes standard markdown.
        findAndReplace(section, '\n', '\n\n');

        // This will be used, once, to convert old challenges to the new
        // format, so it's not as dangerous as it sounds.
        node.value = toHtml(section, {
          allowDangerousCharacters: true,
          allowDangerousHTML: true,
          quote: "'"
        });
      }
    }
  }
}

module.exports = plugin;
