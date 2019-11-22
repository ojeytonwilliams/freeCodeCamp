const visit = require('unist-util-visit');
const toHast = require('mdast-util-to-hast');
const raw = require('hast-util-raw');
const findAndReplace = require('hast-util-find-and-replace');
const toHtml = require('hast-util-to-html');
const isEmpty = require('lodash/isEmpty');
const unified = require('unified');
const vfile = require('vfile');

const html = require('rehype-parse');

const util = require('util');

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

const parser = unified().use(html, {
  emitParseErrors: true,
  duplicateAttribute: false,
  missingDoctype: false
});


function parseSync(text) {
  return parser.parse(text, { emitParseErrors: true });
}

function plugin() {
  return transformer;

  function transformer(tree) {
    return visit(tree, 'html', visitor);

    function visitor(node) {
      console.log('original node', node);
      // 'html' nodes contain un-parsed html strings, so we first convert them
      // to hast and then parse them to produce a syntax tree (so we can locate
      // and modify the instructions and description)
      const section = raw(toHast(node, { allowDangerousHTML: true }), {
        emitParseErrors: true
      });
      if (
        section.type === 'element' &&
        (section.properties.id === 'instructions' ||
          section.properties.id === 'description') &&
        !isEmpty(section.children)
      ) {
        console.log('IN SECTION');
        // ideally not regex, but if I have to:
        const hasClosingTag = /<\/section>\s*$/.test(node.value);
        // const test = parseSync('</section>');
        // const invalidHtml = `<!doctype html>
        // <title>abandoned-head-element-child</title>
        // </head>
        // <script>this.one.cant.be.here();</script>`
        const file = vfile('<section>'); // This doesn't seem to emit errors.  Fuck.
        const test = parseSync(file);
        console.log('PARSED?', test);

        console.log('Children?', test.children[0].children);
        console.log('FILE?', file);
        // section contains the section tag and all the text up to the first
        // blank line.

        // Next a newline needs inserting at the start, since this is needed
        // to ensure the text will be parsed as markdown.

        section.children.unshift({ type: 'text', value: '\n' });

        // This replaces single line breaks with empty lines, so
        // that the section text that previously required special treatment
        // becomes standard markdown.
        findAndReplace(section, '\n', '\n\n');

        // This can come from an unclosed <section>, so we have to pretend it's
        // a root element (otherwise it gets wrapped in a tag) and add the
        // opening <section> back in by hand.
        node.value =
          `<section id='${section.properties.id}'>\n` +
          toHtml(
            { type: 'root', children: section.children },
            {
              allowDangerousCharacters: true,
              allowDangerousHTML: true,
              quote: "'"
            }
          );
      }
    }
  }
}

module.exports = plugin;
