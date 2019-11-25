/* global expect */

const { escapeMd, getParagraphs } = require('./insert-spaces');

describe('insert-spaces', () => {
  describe('getParagraphs', () => {
    it('shouldreturn a node unchanged if it has no newlines', () => {
      const oneLine = { type: 'text', value: 'ab' };
      expect(getParagraphs(oneLine)).toEqual(oneLine);
    });
    it('should split a text node at a newline', () => {
      const twoLines = { type: 'text', value: 'a\nb' };
      expect(getParagraphs(twoLines)).toHaveLength(3);
      const threeLines = { type: 'text', value: 'a\nb\nc' };
      expect(getParagraphs(threeLines)).toHaveLength(5);
    });
    it('should create blank lines to replace \\n', () => {
      const twoLines = { type: 'text', value: 'a\nb' };
      const expected = [
        { type: 'text', value: 'a' },
        { type: 'text', value: '\n\n' },
        { type: 'text', value: 'b' }
      ];
      expect(getParagraphs(twoLines)).toEqual(expected);
    });
  });

  describe('escapeMd', () => {
    it('should not add a trailing newline', () => {
      const alreadyEscaped = { type: 'text', value: 'hi!' };
      expect(escapeMd(alreadyEscaped)).toEqual(alreadyEscaped);
    });
    it('should not escape a single newline', () => {
      // this is how we're splitting up the paragraphs
      const newLine = { type: 'text', value: '\n' };
      expect(escapeMd(newLine)).toEqual(newLine);
    });
  });
});

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
            return escapeMd(child);
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
