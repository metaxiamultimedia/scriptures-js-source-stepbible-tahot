/**
 * @metaxia/scriptures-source-stepbible-tahot
 *
 * STEPBible's TAHOT (Translators Amalgamated Hebrew OT): every word of the
 * Hebrew OT with STEPBible's own disambiguated Strong's tags, plus STEPBible's
 * augmented Strong's table.
 */

export {
  metadata,
  dataPath,
  loadChapter,
  loadChapterSync,
  getVerseWords,
  getVerseWordsSync,
  loadAugmentedStrongsSync,
  augmentedStrongsFor,
  defaultAugmentedStrong,
  parseAugmentedReference,
  resolveAugmentedStrong,
} from './source.js';
export { parseDStrongs } from './dstrongs.js';
export type { AugmentedResolution } from './source.js';
export type { TahotWord, TahotTag, TahotChapter, AugmentedStrong } from './types.js';
