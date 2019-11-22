const {
  formatFile: formatFile,
  fenceText: codeToBackticks,
  prettifyText: prettify
} = require('./transformChallenges');
const readDirP = require('readdirp-walk');
const fs = require('fs');

const challengeDir = '../../curriculum/challenges/english';

// readDirP({ root: challengeDir, fileFilter: ['*.md'] }).on('data', file => {
//   if (file.stat.isFile()) {
//     formatFile(file.fullPath)
//       .then(prettify)
//       .then(text => fs.writeFileSync(file.fullPath, text))
//       .catch(err => {
//         console.log(file.path);
//         // console.log('formatting err', err.message);
//       });
//   }
// });

// formatFile(
//   // eslint-disable-next-line
//   '../../curriculum/challenges/english/09-certificates/responsive-web-design-certificate/responsive-web-design-certificate.english.md'
// ).then(output => console.log(output));

// formatFile(
//   // eslint-disable-next-line
//   '../../curriculum/challenges/english/01-responsive-web-design/basic-html-and-html5/say-hello-to-html-elements.english.md'
// )
//   .then(prettify)
//   .then(output => console.log(output));

// formatFile(
//   // eslint-disable-next-line
//   '../../curriculum/challenges/english/08-coding-interview-prep/take-home-projects/build-a-camper-leaderboard.english.md'
// ).then(output => console.log(output));

// formatFile(
//   // eslint-disable-next-line
//   '../../curriculum/challenges/portuguese/02-javascript-algorithms-and-data-structures/basic-javascript/returning-boolean-values-from-functions.portuguese.md'
// ).then(output => console.log(output));

// // This one turns links *inside code blocks* into anchors
// formatFile(
//   // eslint-disable-next-line
//   '../../curriculum/challenges/english/01-responsive-web-design/basic-html-and-html5/add-images-to-your-website.english.md'
// )
//   .then(prettify)
//   .then(output => console.log(output));

// formatFile(
//   // eslint-disable-next-line
//   '../../curriculum/challenges/russian/01-responsive-web-design/basic-css/cascading-css-variables.russian.md'
// ).then(output => console.log(output));

// NOTE: the next one has an unterminated code block!

// formatFile(
//   // eslint-disable-next-line
//   '../../curriculum/challenges/english/08-coding-interview-prep/data-structures/search-within-a-linked-list.english.md'
// )
//   .then(prettify)
//   .then(output => console.log(output));

// formatFile(
//   // eslint-disable-next-line
//   '../../curriculum/challenges/english/08-coding-interview-prep/rosetta-code/sort-disjoint-sublist.english.md'
// )
//   .then(prettify)
//   .then(output => console.log(output));

// // This one closes the section after the h4 tag.  Yikes.
// formatFile(
//   // eslint-disable-next-line
//   '../../curriculum/challenges/english/08-coding-interview-prep/rosetta-code/balanced-brackets.english.md'
// )
//   .then(prettify)
//   .then(output => console.log(output));

// // This one didn't close the section tags
// formatFile(
//   // eslint-disable-next-line
//   '../../curriculum/challenges/english/08-coding-interview-prep/rosetta-code/100-doors.english.md'
// )
//   .then(prettify)
//   .then(output => console.log(output));

/* challenges with complicated code blocks:

03-front-end-libraries/front-end-libraries-projects/build-a-javascript-calculator.english.md
01-responsive-web-design/responsive-web-design-principles/create-a-media-query.english.md
03-front-end-libraries/bootstrap/add-font-awesome-icons-to-our-buttons.english.md
01-responsive-web-design/basic-html-and-html5/add-images-to-your-website.english.md
02-javascript-algorithms-and-data-structures/javascript-algorithms-and-data-structures-projects/palindrome-checker.english.md
02-javascript-algorithms-and-data-structures/basic-algorithm-scripting/factorialize-a-number.english.md
06-information-security-and-quality-assurance/advanced-node-and-express/send-and-display-chat-messages.english.md
01-responsive-web-design/basic-css/import-a-google-font.english.md
01-responsive-web-design/basic-html-and-html5/link-to-external-pages-with-anchor-elements.english.md
01-responsive-web-design/basic-html-and-html5/turn-an-image-into-a-link.english.md
02-javascript-algorithms-and-data-structures/es6/use-getters-and-setters-to-control-access-to-an-object.english.md
03-front-end-libraries/bootstrap/use-responsive-design-with-bootstrap-fluid-containers.english.md
03-front-end-libraries/bootstrap/use-the-bootstrap-grid-to-put-elements-side-by-side.english.md
08-coding-interview-prep/rosetta-code/emirp-primes.english.md
08-coding-interview-prep/rosetta-code/extensible-prime-generator.english.md
08-coding-interview-prep/rosetta-code/factors-of-a-mersenne-number.english.md
08-coding-interview-prep/rosetta-code/farey-sequence.english.md
08-coding-interview-prep/rosetta-code/fibonacci-sequence.english.md
08-coding-interview-prep/rosetta-code/heronian-triangles.english.md
08-coding-interview-prep/rosetta-code/sort-disjoint-sublist.english.md
08-coding-interview-prep/rosetta-code/zeckendorf-number-representation.english.md

*/

/* NOTE: some deliberate links exist in the challenge (READ-SEARCH-ASK etc).
Those must be kept and perhaps should be converted to []() format, assuming they
behave (wrt to tab opening etc) okay */

// link inside code tags
formatFile(
  // eslint-disable-next-line
  '../../curriculum/challenges/english/03-front-end-libraries/front-end-libraries-projects/build-a-javascript-calculator.english.md'
)
  .then(codeToBackticks)
  .then(prettify)
  .then(output => console.log(output));
