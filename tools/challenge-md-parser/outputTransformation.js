const path = require('path');
const { formatMarkdown } = require('./transformChallenges');
const readDirP = require('readdirp-walk');
const fs = require('fs');

const challengeDir = '../../curriculum/challenges/';

readDirP({ root: challengeDir, fileFilter: ['*.md'] }).on('data', file => {
  if (file.stat.isFile()) {
    formatMarkdown(file.fullPath)
      .then(text => fs.writeFileSync(file.fullPath, text))
      .catch(err => {
        console.log('format err', err);
        console.log('file in question', file);
        throw err;
      });
  }
});
// formatMarkdown(
//   // eslint-disable-next-line
//   '../../curriculum/challenges/english/09-certificates/responsive-web-design-certificate/responsive-web-design-certificate.english.md'
// ).then(output => console.log(output));

// formatMarkdown(
//   // eslint-disable-next-line
//   '../../curriculum/challenges/english/01-responsive-web-design/basic-html-and-html5/say-hello-to-html-elements.english.md'
// ).then(output => console.log(output));

// formatMarkdown(
//   // eslint-disable-next-line
//   '../../curriculum/challenges/english/08-coding-interview-prep/take-home-projects/build-a-camper-leaderboard.english.md'
// ).then(output => console.log(output));
