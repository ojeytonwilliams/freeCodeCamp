'use strict';

const components = require(`prismjs/components`);
const rule = require('unified-lint-rule');
const visit = require('unist-util-visit');

module.exports = rule('remark-lint:prism-languages', hasPrismLanguage);

const reason = ' is not supported by PrismJS';

// TODO: require fences DON'T fix, though, ideally, since it usually means
// a mistake has been made.

/* If the code block has a language, check it's one that PrismJS supports */
function hasPrismLanguage(tree, file) {
  visit(tree, 'code', visitor);

  function visitor(node) {
    // whitespace around the language is ignored by the parser, as is case:
    const baseLang = node.lang ? node.lang.trim().toLowerCase() : '';
    const lang = getBaseLanguageName(baseLang);
    if (baseLang && !lang) {
      file.message(baseLang + reason, node);
    }
  }
}

/*
 * This is the method used by https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby-remark-prismjs/src/load-prism-language.js
 */

// Get the real name of a language given it or an alias
const getBaseLanguageName = nameOrAlias => {
  if (components.languages[nameOrAlias]) {
    return nameOrAlias;
  }
  return Object.keys(components.languages).find(language => {
    const { alias } = components.languages[language];
    if (!alias) return false;
    if (Array.isArray(alias)) {
      return alias.includes(nameOrAlias);
    } else {
      return alias === nameOrAlias;
    }
  });
};
