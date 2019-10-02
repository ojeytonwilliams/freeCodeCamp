'use strict';

const rule = require('unified-lint-rule');
const visit = require('unist-util-visit');

module.exports = rule(
  'remark-lint:blank-lines-around-section-tags',
  blankLinesAroundSection
);

const description = /<section id='description'>[\s\S]+/;
const instructions = /<section id='instructions'>[\s\S]+/;
const reason = 'section tags must be followed by a blank line';

function blankLinesAroundSection(tree, file) {
  visit(tree, 'html', visitor);

  function visitor(node) {
    if (description.test(node.value) || instructions.test(node.value)) {
      file.message(reason, node);
    }
  }
}
