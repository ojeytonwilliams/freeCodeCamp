const path = require('path');
const {
  findIndex,
  reduce,
  toString,
  forIn,
  isEmpty,
  isEqual
} = require('lodash');
const readDirP = require('readdirp-walk');
const { parseMarkdown } = require('../tools/challenge-md-parser');
const { parseMDX } = require('../tools/challenge-md-parser/mdx');
const fs = require('fs');
const util = require('util');
/* eslint-disable max-len */
const {
  mergeChallenges,
  translateCommentsInChallenge
} = require('../tools/challenge-md-parser/translation-parser/translation-parser');
/* eslint-enable max-len*/

const { isAuditedCert } = require('../utils/is-audited');
const { dasherize, nameify } = require('../utils/slugs');
const { createPoly } = require('../utils/polyvinyl');
const { blockNameify } = require('../utils/block-nameify');
const { supportedLangs } = require('./utils');
const diff = require('diff');

const access = util.promisify(fs.access);

const challengesDir = path.resolve(__dirname, './challenges');
const metaDir = path.resolve(challengesDir, '_meta');
exports.challengesDir = challengesDir;
exports.metaDir = metaDir;

const COMMENT_TRANSLATIONS = createCommentMap(
  path.resolve(__dirname, './dictionaries')
);

function getTranslatableComments(dictionariesDir) {
  const { COMMENTS_TO_TRANSLATE } = require(path.resolve(
    dictionariesDir,
    'english',
    'comments'
  ));
  return COMMENTS_TO_TRANSLATE.map(({ text }) => text);
}

exports.getTranslatableComments = getTranslatableComments;

function createCommentMap(dictionariesDir) {
  // get all the languages for which there are dictionaries.
  const languages = fs
    .readdirSync(dictionariesDir)
    .filter(x => x !== 'english');

  // get all their dictionaries
  const dictionaries = languages.reduce(
    (acc, lang) => ({
      ...acc,
      [lang]: require(path.resolve(dictionariesDir, lang, 'comments'))
    }),
    {}
  );

  // get the english dicts
  const {
    COMMENTS_TO_TRANSLATE,
    COMMENTS_TO_NOT_TRANSLATE
  } = require(path.resolve(dictionariesDir, 'english', 'comments'));

  // map from english comment text to translations
  const translatedCommentMap = COMMENTS_TO_TRANSLATE.reduce(
    (acc, { id, text }) => {
      return {
        ...acc,
        [text]: getTranslationEntry(dictionaries, { engId: id, text })
      };
    },
    {}
  );

  // map from english comment text to itself
  const untranslatableCommentMap = COMMENTS_TO_NOT_TRANSLATE.reduce(
    (acc, { text }) => {
      const englishEntry = languages.reduce(
        (acc, lang) => ({
          ...acc,
          [lang]: text
        }),
        {}
      );
      return {
        ...acc,
        [text]: englishEntry
      };
    },
    {}
  );

  return { ...translatedCommentMap, ...untranslatableCommentMap };
}

exports.createCommentMap = createCommentMap;

function getTranslationEntry(dicts, { engId, text }) {
  return Object.keys(dicts).reduce((acc, lang) => {
    const entry = dicts[lang].find(({ id }) => engId === id);
    if (entry) {
      return { ...acc, [lang]: entry.text };
    } else {
      throw Error(`Missing translation for comment
'${text}'
        with id of ${engId}`);
    }
  }, {});
}

function getChallengesDirForLang(lang) {
  return path.resolve(challengesDir, `./${lang}`);
}

function getMetaForBlock(block) {
  return JSON.parse(
    fs.readFileSync(path.resolve(metaDir, `./${block}/meta.json`), 'utf8')
  );
}

exports.getChallengesDirForLang = getChallengesDirForLang;
exports.getMetaForBlock = getMetaForBlock;

exports.getChallengesForLang = function getChallengesForLang(lang) {
  let curriculum = {};
  return new Promise(resolve => {
    let running = 1;
    function done() {
      if (--running === 0) {
        resolve(curriculum);
      }
    }
    readDirP({ root: getChallengesDirForLang(lang) })
      .on('data', file => {
        running++;
        buildCurriculum(file, curriculum, lang).then(done);
      })
      .on('end', done);
  });
};

async function buildCurriculum(file, curriculum, lang) {
  const { name, depth, path: filePath, stat } = file;
  const createChallenge = createChallengeCreator(challengesDir, lang);
  if (depth === 1 && stat.isDirectory()) {
    // extract the superBlock info
    const { order, name: superBlock } = superBlockInfo(name);
    curriculum[superBlock] = { superBlock, order, blocks: {} };
    return;
  }
  if (depth === 2 && stat.isDirectory()) {
    const blockName = getBlockNameFromPath(filePath);
    const metaPath = path.resolve(
      __dirname,
      `./challenges/_meta/${blockName}/meta.json`
    );
    const blockMeta = require(metaPath);
    const { isUpcomingChange } = blockMeta;
    if (typeof isUpcomingChange !== 'boolean') {
      throw Error(
        `meta file at ${metaPath} is missing 'isUpcomingChange', it must be 'true' or 'false'`
      );
    }

    if (!isUpcomingChange || process.env.SHOW_UPCOMING_CHANGES === 'true') {
      // add the block to the superBlock
      const { name: superBlock } = superBlockInfoFromPath(filePath);
      const blockInfo = { meta: blockMeta, challenges: [] };
      curriculum[superBlock].blocks[name] = blockInfo;
    }
    return;
  }
  if (name === 'meta.json' || name === '.DS_Store') {
    return;
  }

  const block = getBlockNameFromPath(filePath);
  const { name: superBlock } = superBlockInfoFromPath(filePath);
  let challengeBlock;

  // TODO: this try block and process exit can all go once errors terminate the
  // tests correctly.
  try {
    challengeBlock = curriculum[superBlock].blocks[block];
    if (!challengeBlock) {
      // this should only happen when a isUpcomingChange block is skipped
      return;
    }
  } catch (e) {
    console.log(`failed to create superBlock ${superBlock}`);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
  const { meta } = challengeBlock;

  // TODO: once all the challenges are mdx, these conditionals can go.
  const isMDX = filePath.slice(-1) === 'x';
  const isCert = superBlock === 'certificates';

  if (isMDX && !isCert) {
    const challenge = await createChallenge(filePath, meta);

    challengeBlock.challenges = [...challengeBlock.challenges, challenge];
  }

  if (!isMDX && isCert) {
    const challenge = await createChallenge(filePath, meta);

    challengeBlock.challenges = [...challengeBlock.challenges, challenge];
  }
}

async function parseTranslation(engPath, transPath, dict, lang) {
  const engChal = await parseMarkdown(engPath);
  const translatedChal = await parseMarkdown(transPath);

  // challengeType 11 is for video challenges, which have no seeds, so we skip
  // them.
  const engWithTranslatedComments =
    engChal.challengeType !== 11
      ? translateCommentsInChallenge(engChal, lang, dict)
      : engChal;
  return mergeChallenges(engWithTranslatedComments, translatedChal);
}

function createChallengeCreator(basePath, lang) {
  const hasEnglishSource = hasEnglishSourceCreator(basePath);
  return async function createChallenge(filePath, maybeMeta) {
    function getFullPath(pathLang, relativePath = filePath) {
      return path.resolve(__dirname, basePath, pathLang, relativePath);
    }
    let meta;
    if (maybeMeta) {
      meta = maybeMeta;
    } else {
      const metaPath = path.resolve(
        metaDir,
        `./${getBlockNameFromPath(filePath)}/meta.json`
      );
      meta = require(metaPath);
    }
    const { name: superBlock } = superBlockInfoFromPath(filePath);
    if (!supportedLangs.includes(lang))
      throw Error(`${lang} is not a accepted language.
  Trying to parse ${filePath}`);
    if (lang !== 'english' && !(await hasEnglishSource(filePath)))
      throw Error(`Missing English challenge for
${filePath}
It should be in
${getFullPath('english')}
`);
    // assumes superblock names are unique
    // while the auditing is ongoing, we default to English for un-audited certs
    // once that's complete, we can revert to using isEnglishChallenge(fullPath)
    const useEnglish = lang === 'english' || !isAuditedCert(lang, superBlock);
    const isMdx = getFullPath('english').slice(-1) === 'x';
    let challenge;

    if (isMdx) {
      challenge = await parseMDX(getFullPath('english'));
      const challengeMD = await (useEnglish
        ? parseMarkdown(getFullPath('english', filePath.slice(0, -1)))
        : parseTranslation(
            getFullPath('english', filePath.slice(0, -1)),
            getFullPath(lang),
            COMMENT_TRANSLATIONS,
            lang
          ));
      let match = true;
      forIn(challenge, (value, key) => {
        let mdValue = challengeMD[key];
        // Simplify to return the final comparison.
        if (isEmpty(value)) {
          match = isEmpty(mdValue) ? match : false;
          if (!match) {
            console.log('TITLE', challenge.title);
            console.log('failed with', key);
          }
          return isEmpty(mdValue);
        }
        if (key === 'solutions' && isEqual(value, [{}])) {
          match = isEmpty(mdValue) ? match : false;
          if (!match) {
            console.log('TITLE', challenge.title);
            console.log('failed with', key);
          }
          return isEmpty(mdValue);
        }
        if (key === 'solutions') {
          value.forEach((solution, idx) => {
            match = compareFiles(mdValue[idx], solution) ? match : false;
          });
          if (!match) {
            console.log('TITLE', challenge.title);
            console.log('failed with', key);
          }
          return isEmpty(mdValue);
        }

        if (key === 'files') {
          match = compareFiles(mdValue, value) ? match : false;
          if (!match) {
            console.log('TITLE', challenge.title);
            console.log('failed with', key);
          }
          return isEmpty(mdValue);
        }

        // TODO: remove wbrs

        // TODO: final checks, ignoring the descriptions which we know can
        // differ in trivial ways

        if (key === 'tests') {
          value.forEach(({ text, testString }, idx) => {
            match =
              mdValue[idx].text.trim() === text.trim() &&
              mdValue[idx].testString.trim() === testString.trim()
                ? match
                : false;
            if (!match) {
              console.log('TITLE', challenge.title);
              console.log('failed with', key);
              // console.log('MD');
              // console.log(mdValue[idx].text);
              // console.log(mdValue[idx].testString);
              // console.log('MDX');
              // console.log(value[idx].text);
              // console.log(value[idx].testString);
              match = true;
            }
          });

          return isEmpty(mdValue);
        }
        if (key === 'description' || key === 'instructions') {
          if (isEqual(value, mdValue)) {
            return true;
          } else {
            // check that the only difference is that md has <p><tag> and mdx
            // just has <tag> or that it's <pre>\n vs <pre>. For simplicity I'm
            // ignoring the attributes, because they're quoted differently by
            // the two parsers, "" in md '' in mdx.

            value = value
              .replace(/<pre>\n/g, '<pre>')
              .replace(/<table([^>]*)>/g, '<table>')
              .replace(/<img([^>]*)>/g, '<img>')
              .replace(/<div([^>]*)>/g, '<div>');

            mdValue = mdValue
              .replace(/<p><pre>/g, '<pre>')
              .replace(/<\/pre><\/p>/g, '</pre>')
              .replace(/<p><h4>/g, '<h4>')
              .replace(/<\/h4><\/p>/g, '</h4>')
              .replace(/<p><table([^>]*)>/g, '<table>')
              .replace(/<\/table><\/p>/g, '</table>')
              .replace(/<p><img([^>]*)>/g, '<img>')
              .replace(/<img([^>]*)><\/p>/g, '<img>')
              .replace(/<\/img><\/p>/g, '</img>')
              .replace(/<p><div([^>]*)>/g, '<div>')
              .replace(/<\/div><\/p>/g, '</div>')
              .replace(/<p><ul>/g, '<ul>')
              .replace(/<\/ul><\/p>/g, '</ul>')
              .replace(/<p><li>/g, '<li>')
              .replace(/<\/li><\/p>/g, '</li>')
              .replace(/<p><ol>/g, '<ol>')
              .replace(/<\/ol><\/p>/g, '</ol>')
              .replace(/<p><blockquote>/g, '<blockquote>')
              .replace(/<\/blockquote><\/p>/g, '</blockquote>')
              .replace(/<p><!--/g, '<!--')
              .replace(/--><\/p>/g, '-->');
            // match = isEqual(value, mdValue);
            const changes = diff.diffLines(mdValue, value);
            changes.forEach(({ added, removed, value }) => {
              if (added || removed) {
                if (value !== '"' && value !== "'" && value.trim() !== '') {
                  console.log('Diff!');
                  console.log(added ? 'added  ' : 'removed', value);
                  match = false;
                }
              }
            });

            if (!match) {
              console.log('TITLE', challenge.title);
              console.log('failed with desc/inst: ', key);
              console.log('MD');
              console.log(mdValue);
              console.log('MDX');
              console.log(value);
              // process.exit()
            }
            return false;
          }
        }

        if (isEqual(value, mdValue)) {
          return true;
        } else {
          console.log('TITLE', challenge.title);
          console.log('failed with', key);
          console.log('MD');
          console.log(mdValue);
          console.log('MDX');
          console.log(value);
        }
      });

      // if (!match) {
      //   console.dir(challenge, { depth: null });
      //   console.dir(challengeMD, { depth: null });
      //   process.exit(-1);
      // }
    } else {
      challenge = await (useEnglish
        ? parseMarkdown(getFullPath('english'))
        : parseTranslation(
            getFullPath('english'),
            getFullPath(lang),
            COMMENT_TRANSLATIONS,
            lang
          ));
    }
    const challengeOrder = findIndex(
      meta.challengeOrder,
      ([id]) => id === challenge.id
    );
    const {
      name: blockName,
      order,
      superOrder,
      isPrivate,
      required = [],
      template,
      time
    } = meta;
    challenge.block = blockName;
    challenge.dashedName =
      lang === 'english'
        ? dasherize(challenge.title)
        : dasherize(challenge.originalTitle);
    delete challenge.originalTitle;
    challenge.order = order;
    challenge.superOrder = superOrder;
    challenge.superBlock = superBlock;
    challenge.challengeOrder = challengeOrder;
    challenge.isPrivate = challenge.isPrivate || isPrivate;
    challenge.required = required.concat(challenge.required || []);
    challenge.template = template;
    challenge.time = time;

    return prepareChallenge(challenge);
  };
}

// Yes, this is horrid.  It's just a hack because the mdx parser trims the trailing
// /n, but the md parser does not (and we don't care)
function compareFiles(fileFromMarkdown, fileFromMdx) {
  let match = true;
  Object.entries(fileFromMarkdown).forEach(([fileindex, mdSoln]) => {
    Object.entries(mdSoln).forEach(([prop, value]) => {
      if (['contents', 'head', 'tail'].includes(prop)) {
        if (value.slice(0, -1) !== fileFromMdx[fileindex][prop]) {
          console.log(`${prop} mismatch`);
          match = false;
        }
      } else if (prop === 'id') {
        // ignore it, because ids are new
      } else if (!isEqual(fileFromMdx[fileindex][prop], value)) {
        console.log('failing because of ' + prop);
        match = false;
      }
    });
  });
  return match;
}

// TODO: tests and more descriptive name.
function filesToObject(files) {
  return reduce(
    files,
    (map, file) => {
      map[file.key] = {
        ...file,
        head: arrToString(file.head),
        contents: arrToString(file.contents),
        tail: arrToString(file.tail)
      };
      return map;
    },
    {}
  );
}

// gets the challenge ready for sourcing into Gatsby
function prepareChallenge(challenge) {
  challenge.name = nameify(challenge.title);
  if (challenge.files) {
    challenge.files = filesToObject(challenge.files);
    challenge.files = Object.keys(challenge.files)
      .filter(key => challenge.files[key])
      .map(key => challenge.files[key])
      .reduce(
        (files, file) => ({
          ...files,
          [file.key]: {
            ...createPoly(file),
            seed: file.contents.slice(0)
          }
        }),
        {}
      );
  }

  if (challenge.solutionFiles) {
    challenge.solutionFiles = filesToObject(challenge.solutionFiles);
  }
  challenge.block = dasherize(challenge.block);
  challenge.superBlock = blockNameify(challenge.superBlock);
  return challenge;
}

function hasEnglishSourceCreator(basePath) {
  const englishRoot = path.resolve(__dirname, basePath, 'english');
  return async function(translationPath) {
    return await access(
      path.join(englishRoot, translationPath),
      fs.constants.F_OK
    )
      .then(() => true)
      .catch(() => false);
  };
}

function superBlockInfoFromPath(filePath) {
  const [maybeSuper] = filePath.split(path.sep);
  return superBlockInfo(maybeSuper);
}

function superBlockInfo(fileName) {
  const [maybeOrder, ...superBlock] = fileName.split('-');
  let order = parseInt(maybeOrder, 10);
  if (isNaN(order)) {
    return { order: 0, name: fileName };
  } else {
    return {
      order: order,
      name: superBlock.join('-')
    };
  }
}

function getBlockNameFromPath(filePath) {
  const [, block] = filePath.split(path.sep);
  return block;
}

function arrToString(arr) {
  return Array.isArray(arr) ? arr.join('\n') : toString(arr);
}

exports.hasEnglishSourceCreator = hasEnglishSourceCreator;
exports.parseTranslation = parseTranslation;
exports.createChallengeCreator = createChallengeCreator;
