const unified = require('unified');
const remarkParse = require('remark-parse');
const remarkStringify = require('remark-stringify');

var compiler = unified()
  .use(remarkParse)
  .use(remarkStringify);

function parse(mdast) {
  return compiler.parse(mdast);
}

console.log(parse('Just some \n\n text <em> phas</em> some text'));

console.log();

console.log(
  parse('Just some \n\n text <em> phas</em> some text').children[1].children
);
