const visit = require('unist-util-visit');
const toHast = require('mdast-util-to-hast');
const raw = require('hast-util-raw');
const findAndReplace = require('hast-util-find-and-replace');
const toHtml = require('hast-util-to-html');
const isEmpty = require('lodash/isEmpty');
const parseEntities = require('parse-entities');

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
function plugin() {
  return transformer;

  function transformer(tree) {
    return visit(tree, 'html', visitor);

    function codeVisitor(node) {
      console.log('CODE NODE', node);
      // TODO: replace code elements with text and parse any entities
      // can we return the replacement to replace it in the original tree?
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
        console.log('SECTION!', section);
        // section contains the section tag and all the text up to the first
        // blank line.

        // First a newline needs inserting at the start, since this is needed
        // no matter what.

        section.children.unshift({ type: 'text', value: '\n' });

        // This replaces single line breaks with empty lines, so
        // that the section text that previously required special treatment
        // becomes standard markdown.
        findAndReplace(section, '\n', '\n\n');

        // This will be used, once, to convert old challenges to the new
        // format, so it's not as dangerous as it sounds.

        visit(section, 'element', codeVisitor)

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
