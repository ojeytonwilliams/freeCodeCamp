/* global expect */

const fs = require('fs');
const path = require('path');

const { insertSpaces, codeToBackticks } = require('./transformChallenges');

const fixtures = ['billion-names.md', 'link-internal.md'];

describe('Challenge formatter', () => {
  it('should transform challenges into GFM correctly', () => {
    const tests = fixtures.map(fixture =>
      insertSpaces(path.resolve(__dirname, '__fixtures__/' + fixture), true)
        .then(codeToBackticks)
        .then(output => {
          const formattedMd = fs.readFileSync(
            path.resolve(__dirname, '__fixtures__/' + fixture + '.formatted'),
            {
              encoding: 'utf8'
            }
          );
          expect(output).toEqual(formattedMd);
        })
    );

    return Promise.all(tests);
  });
});
