/* global expect */

const h = require('hastscript');
const u = require('unist-builder');
const toHtml = require('hast-util-to-html');

const { escapeMd, getParagraphs, wrapBareUrls } = require('./insert-spaces');

const blankLine = u('text', '\n\n');

describe('insert-spaces', () => {
  describe('getParagraphs', () => {
    it('should return a node unchanged if it has no newlines', () => {
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
    it('should give a sentence starting \\n a starting blank line', () => {
      const startingNewline = { type: 'text', value: '\na' };
      const expected = [
        { type: 'text', value: '\n\n' },
        { type: 'text', value: 'a' }
      ];
      expect(getParagraphs(startingNewline)).toEqual(expected);
    });
  });

  describe('escapeMd', () => {
    it('should not add a trailing newline', () => {
      const alreadyEscaped = { type: 'text', value: 'hi!' };
      expect(escapeMd(alreadyEscaped)).toEqual(alreadyEscaped);
    });
    it('should not escape a double newline', () => {
      // they're needed to separate the paragraphs
      const newLine = { type: 'text', value: '\n\n' };
      expect(escapeMd(newLine)).toEqual(newLine);
    });
  });

  describe('wrapBareUrls', () => {
    it('should not modify blank line nodes', () => {
      expect(wrapBareUrls(blankLine)).toEqual(blankLine);
    });

    it('should not modify nodes without bare urls', () => {
      const noBareUrls = u('text', 'Just some words.');
      expect(wrapBareUrls(noBareUrls)).toEqual(noBareUrls);
    });
    it('should replace bare urls with code elements', () => {
      const urlBare = u('text', 'a https://example.com b');
      const childrenBare = wrapBareUrls(urlBare);
      const actualBare = h('');
      actualBare.children = childrenBare;
      const expectedBare = toHtml(
        h('', ['a ', h('code', 'https://example.com'), ' b'])
      );
      expect(toHtml(actualBare)).toEqual(expectedBare);
    });

    it('should replace quoted bare urls with code elements', () => {
      const urlQuoted = {
        type: 'text',
        value: 'a "<code>https://example.com</code>" b'
      };
      const childrenQuoted = wrapBareUrls(urlQuoted);
      const actualQuoted = h('');
      actualQuoted.children = childrenQuoted;
      const expectedQuoted = toHtml(
        h('', ['a "', h('code', 'https://example.com'), '" b'])
      );
      expect(toHtml(actualQuoted)).toEqual(expectedQuoted);
    });
  });

  describe('sectionFromTemplate', () => {
    it('should indent correctly', () => {});
  });
});
