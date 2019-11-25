/* global expect */

const fs = require('fs');
const path = require('path');

const { insertSpaces, codeToBackticks } = require('./transformChallenges');

describe('Challenge formatter', () => {
  it('transform a challenge into GFM while respecting formatting', () => {
    return insertSpaces(
      path.resolve(__dirname, '__fixtures__/billion-names.md'),
      true
    )
      .then(codeToBackticks)
      .then(output => {
        const formattedMd = fs.readFileSync(
          path.resolve(__dirname, '__fixtures__/billion-names.formatted.md'),
          {
            encoding: 'utf8'
          }
        );
        expect(output).toEqual(formattedMd);
      });
  });
});
