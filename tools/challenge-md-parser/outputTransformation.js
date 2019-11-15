const { formatMarkdown } = require('./transformChallenges');

formatMarkdown(
  // eslint-disable-next-line
  '../../curriculum/challenges/english/01-responsive-web-design/basic-html-and-html5/say-hello-to-html-elements.english.md'
).then(output => console.log(output));
