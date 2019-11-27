const unified = require('unified');
const visit = require('unist-util-visit');
const toHast = require('mdast-util-to-hast');
const raw = require('hast-util-raw');
const toHtml = require('hast-util-to-html');
const isEmpty = require('lodash/isEmpty');
const isEqual = require('lodash/isEqual');
const dedent = require('dedent');
const hastToMdast = require('hast-util-to-mdast');
const remarkStringify = require('remark-stringify');
const rehypeStringify = require('rehype-stringify');
const remarkParse = require('remark-parse');
const { root, inlineCode } = require('mdast-builder');

const newLine = { type: 'text', value: '\n' };
const blankLine = { type: 'text', value: '\n\n' };

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

var parser = unified().use(remarkParse);
var mdCompiler = unified().use(remarkStringify);
var htmlCompiler = unified().use(rehypeStringify);

function stringifyMd(mdast) {
  return mdCompiler.stringify(mdast);
}

function stringifyHast(hast) {
  return htmlCompiler.stringify(hast);
}

function parseMd(text) {
  return parser.parse(text);
}

function escapeMd(hastNode) {
  // These are added by getParagraphs so must not be touched
  if (hastNode.value === '\n\n') return hastNode;
  // A trailing space gets converted to \n, because hastToMdast will be told
  // told this is a paragraph, which it isn't
  const trailingSpace = / /.test(hastNode.value[hastNode.value.length - 1]);
  // leading spaces also get ignored, but need to be added in, since they can
  // be following html elements.
  const leadingSpace = / /.test(hastNode.value[0]);
  // fake a hast tree.  Is there a less hacky approach?
  const hastTree = {
    type: 'root',
    children: [{ type: 'paragraph', children: [hastNode] }]
  };
  let value = stringifyMd(hastToMdast(hastTree));
  // Removing the last character is always necessary, since stringify appends \n
  value = value.slice(0, -1);
  if (trailingSpace) value += ' ';
  if (leadingSpace) value = ' ' + value;
  return { type: 'text', value };
}

function wrapBareUrls(hastNode) {
  console.log('WRAPPING', hastNode);
  // These are added by getParagraphs so must not be touched
  if (hastNode.value === '\n\n') return hastNode;
  const mdNode = parseMd(hastNode.value);
  visit(mdNode, 'link', linkVisitor);
  // we only want the parsed text, not the complete tree
  const paragraph = mdNode.children[0];
  // discard the wrapper and return the children, to replace the section's
  // existing children
  console.log('PARAGRAPH', paragraph);
  return toHast(paragraph).children;
}

function linkVisitor(node, id, parent) {
  parent.children[id] = inlineCode(node.url);
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

  let children = paragraphs.reduce((acc, curr) => {
    return acc.concat([{ type: 'text', value: curr }, blankLine]);
  }, []);

  children = children.filter(({ value }) => value !== '');

  // Remove the trailing newLine.
  children.pop();
  return children;
}

// NOTE: tried dedent, but I couldn't get it to reliably format pre elements.
function sectionFromTemplate(section, sectionContent, closingTag) {
  return (
    `<section id='${section.properties.id}'>` +
    '\n' +
    sectionContent +
    '\n' +
    closingTag
  );
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
        // if (!isEqual(section.children[0], newLine)) {
        section.children.unshift(blankLine);
        // }

        // should be flatMap, but it's introduced in node 11
        // console.log('before', section);

        // console.log(
        //   'ELEMENTS',
        //   section.children
        //     .filter(({ type }) => type === 'element')
        //      // .map(child => child.children)
        // );

        // break the lines into paragraphs
        section.children = section.children.reduce(
          (acc, child) =>
            acc.concat(child.type === 'text' ? getParagraphs(child) : [child]),
          []
        );
        // console.log(
        //   'ELEMENTS AFTER',
        //   section.children
        //     .filter(({ type }) => type === 'element')
        //     .map(child => child.children)
        // );
        console.log('after', JSON.stringify(section, null, 2));

        // // then wrap bare urls in code tags

        section.children = section.children.reduce(
          (acc, child) =>
            acc.concat(child.type === 'text' ? wrapBareUrls(child) : [child]),
          []
        );

        // next we escape the text nodes, so that syntax like * doesn't start
        // altering the formatting when it's interpretted as markdown

        section.children = section.children.map(child => {
          if (child.type === 'text') {
            return escapeMd(child);
          } else {
            return child;
          }
        });

        console.log('escaped', JSON.stringify(section, null, 2));

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
        // console.log('STRINGIFIED SECTION CONTENT', sectionContent);
        // console.log('STRINGIFIED ORIGINAL SECTION', toHtml(section));

        const closingTag = hasClosingTag ? '</section>\n' : '';

        node.value = sectionFromTemplate(section, sectionContent, closingTag);
        // console.log('FROM TEMPLATE', node.value);
      }
    }
  }
}

exports.insertSpaces = plugin;
exports.escapeMd = escapeMd;
exports.getParagraphs = getParagraphs;
exports.wrapBareUrls = wrapBareUrls;
