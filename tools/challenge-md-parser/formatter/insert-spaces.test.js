/* global expect */

const { escapeMd, getParagraphs } = require('./insert-spaces');

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

  describe('sectionFromTemplate', () => {
    it('should indent correctly', () => {});
  });
});
