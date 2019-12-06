const unified = require('unified');
const toHast = require('mdast-util-to-hast');
const remarkParse = require('remark-parse');
const remarkStringify = require('remark-stringify');
const rehypeStringify = require('rehype-stringify');

const { paragraph, html, root, inlineCode, text } = require('mdast-builder');

var compiler = unified()
  .use(remarkParse)
  .use(remarkStringify);

function parse(mdast) {
  return compiler.parse(mdast);
}

var stringifier = unified().use(remarkStringify);
var stringifierHTML = unified().use(rehypeStringify);
function stringify(text) {
  return stringifier.stringify(text);
}
function stringifyHTML(text) {
  return stringifierHTML.stringify(text);
}

console.log();

console.log(JSON.stringify(parse('a www.example.com  "https://www.example.com". c'), null, 2));

console.log();

console.log(toHast(paragraph([text('a'), inlineCode('b'), text('c')])));

console.log(
  stringifyHTML(toHast(paragraph([text('a'), inlineCode('b'), text('c')])))
);
