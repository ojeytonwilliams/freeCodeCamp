const unified = require('unified');
const visit = require('unist-util-visit');
const toHast = require('mdast-util-to-hast');
const raw = require('hast-util-raw');
const findAndReplace = require('hast-util-find-and-replace');
const toHtml = require('hast-util-to-html');
const isEmpty = require('lodash/isEmpty');
const isEqual = require('lodash/isEqual');
const dedent = require('dedent');
const hastToMdast = require('hast-util-to-mdast');
const remarkStringify = require('remark-stringify');

const newLine = { type: 'text', value: '\n' };

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

var compiler = unified().use(remarkStringify);

function stringify(mdast) {
  return compiler.stringify(mdast);
}

// TODO: add a bunch of unit tests (for the various functions) and acceptance tests
// i.e. does the final, prettified version work?  The acceptance tests should be
// the various markdown files you've found not to work (at some point) in case
// further changes break what once was working.

function escape(hast) {
  if (hast.value === '\n\n') return hast;
  // A trailing space gets converted to \n, because hastToMdast will be told
  // told this is a paragraph, which it isn't
  const trailingSpace = / /.test(hast.value[hast.value.length - 1]);
  // leading spaces also get ignored, but need to be added in, since they can
  // be following html elements.
  const leadingSpace = / /.test(hast.value[0]);
  // fake a hast tree.  Is there a less hacky approach?
  const hastTree = {
    type: 'root',
    children: [{ type: 'paragraph', children: [hast] }]
  };
  let value = stringify(hastToMdast(hastTree));
  // TODO: It might be necessary to always remove the last character, since
  // it seems to always put a \n in there.
  if (trailingSpace) value = value.slice(0, -1) + ' ';
  if (leadingSpace) value = ' ' + value;
  return { type: 'text', value };
}

function getParagraphs(node) {
  // Splitting generates unwanted expty nodes.
  if (node.value === '\n') {
    return node;
  }

  let paragraphs = node.value.split('\n');
  // nothing to split
  if (paragraphs.length <= 1) {
    return node;
  }

  const children = paragraphs.reduce((acc, curr) => {
    if (curr === '') {
      // just a new line, no need to insert an empty text node.
      return acc.concat(newLine);
    } else {
      // NOTE: order matters, here, since we need paragraphs that follow on
      // from html elements to have two linebreaks:
      return acc.concat([newLine, { type: 'text', value: curr }]);
    }
  }, []);
  return children;
}

function sectionFromTemplate(section, sectionContent, closingTag) {
  return dedent`<section id='${section.properties.id}'>
${sectionContent}
${closingTag}`;
}

function plugin() {
  return transformer;

  function transformer(tree) {
    return visit(tree, 'html', visitor);

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
        const hasClosingTag = /<\/section>\s*$/.test(node.value);
        // section contains the section tag and all the text up to the first
        // blank line.

        // This replaces single line breaks with empty lines, so
        // that the section text that previously required special treatment
        // becomes standard markdown.

        // Has to start with an empty line
        if (!isEqual(section.children[0], newLine)) {
          section.children.unshift(newLine);
        }

        // should be flatMap, but it's introduced in node 11
        //  console.log('before', section);
        // break the lines into paragraphs
        section.children = section.children.reduce(
          (acc, child) =>
            acc.concat(child.type === 'text' ? getParagraphs(child) : [child]),
          []
        );
        // console.log('after', section);

        // next we escape the markdown, so that syntax like * doesn't suddenly
        // start altering the formatting.

        section.children = section.children.map(child => {
          if (child.type === 'text') {
            return escape(child);
          } else {
            return child;
          }
        });

        // console.log('escaped', section);

        // This can come from an unclosed <section>, so we have to pretend it's
        // a root element (otherwise it gets wrapped in a tag) and add the
        // opening <section> back in by hand.
        const sectionContent = toHtml(
          { type: 'root', children: section.children },
          {
            allowDangerousCharacters: true,
            allowDangerousHTML: true,
            quote: "'"
          }
        );

        const closingTag = hasClosingTag ? '</section>\n' : '';

        node.value = sectionFromTemplate(section, sectionContent, closingTag);
      }
    }
  }
}

module.exports = plugin;
