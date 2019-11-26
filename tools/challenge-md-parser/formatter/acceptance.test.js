/* global expect */

const fs = require('fs');
const path = require('path');

const {
  insertSpaces,
  codeToBackticks,
  prettify
} = require('./transformChallenges');

// NOTE: As far as html rendering is concerned, it doesn't matter if you write

/*
<pre>  two spaces
</pre>
*/

// or

/*
<pre>
  two spaces
</pre>
*/
// so the html parser trims any leading spaces.
const fixtures = [
  'dead-links.md',
  'nest-anchor.md',
  'hello.md',
  'billion-names.md',
  'link-internal.md',
  'drum-machine.md'
];

describe('Challenge formatter', () => {
  fixtures.forEach(fixture =>
    it(`should transform ${fixture} into GFM correctly`, () => {
      return insertSpaces(
        path.resolve(__dirname, '__fixtures__/' + fixture),
        true
      )
        .then(codeToBackticks)
        .then(prettify)
        .then(output => {
          const formattedMd = fs.readFileSync(
            path.resolve(__dirname, '__fixtures__/' + fixture + '.formatted'),
            {
              encoding: 'utf8'
            }
          );
          expect(output).toEqual(formattedMd);
        });
    })
  );
});
