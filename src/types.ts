/**
 * One tag in TAHOT's dStrongs column, in the order STEPBible wrote it.
 */
export interface TahotTag {
  /** The dStrong, e.g. "H9003", "H7225G", "H9031". */
  tag: string;
  /** True for the root, which STEPBible writes in {curly brackets}. */
  root: boolean;
  /** True when STEPBible marks the tag with "+": it also covers the next Hebrew word. */
  coversNext: boolean;
}

/**
 * One word of STEPBible's TAHOT (Translators Amalgamated Hebrew OT), as one
 * row of the TAHOT file. Text fields are kept as STEPBible wrote them.
 *
 * TAHOT references are English (NRSV) with the Hebrew reference in brackets
 * when it differs, e.g. "Psa.42.4(42.5)#08=L". This package files words under
 * the Hebrew reference and keeps both.
 */
export interface TahotWord {
  /** OSIS book code as used by the @metaxia/scriptures sources (e.g. "Ps", "Deut"). */
  book: string;
  /** Chapter and verse in English Bibles, as STEPBible gives them. */
  chapter: number;
  verse: number;
  /** Chapter and verse in the Hebrew Bible (same as chapter/verse when TAHOT gives no bracketed reference). */
  hebrewChapter: number;
  hebrewVerse: number;
  /**
   * Word number exactly as written after "#": "08" for the 8th word of the
   * Hebrew Ketiv text; four digits ("0501") for words TAHOT adds from the LXX
   * (type X) after word 05.
   */
  word: string;
  /** Text type exactly as written after "=": "L", "Q(K)", "Q(k)", "R", "X", "V", "L(abh)", ... */
  type: string;
  /** Full STEPBible reference field, e.g. "Psa.42.4(42.5)#08=L". */
  ref: string;
  /** Hebrew with "/" between prefixes, root and suffixes and "\" before punctuation. */
  hebrew: string;
  transliteration: string;
  /** English translation, "/" mirroring the Hebrew parts. */
  translation: string;
  /** dStrongs column as written, e.g. "H9002/H9009/{H0776G}\H9016". */
  dStrongs: string;
  /** Tags before the first root (prefixes). */
  prefixes: string[];
  /** Root tags (in {curly brackets}). Usually one. */
  roots: string[];
  /** Tags after the last root (suffixes). */
  suffixes: string[];
  /** Punctuation tags after "\" (e.g. H9014 maqqef, H9016 sof pasuq). */
  punctuation: string[];
  /** Grammar (ETCBC morphology in OpenScriptures form), e.g. "HC/Td/Ncfsa". */
  grammar: string;
  /** Meaning variants column, e.g. "K= va/i.yi.sem (וַ/יֻּישַׂ֤ם) ...". */
  meaningVariants: string;
  /** Spelling variants column, e.g. "L= הַוְצֵ֣א ¦ ;K= הוֹצֵא". */
  spellingVariants: string;
  /**
   * "Root dStrong+Instance" column: the root tag with its instance in the verse
   * ("H0853_A" = 1st H0853, "_b" lower case = an instance not in every
   * manuscript); several separated by ", " when the word has several roots.
   * See TinyURL.com/UpgradingTags.
   */
  rootInstance: string;
  /** "Alternative Strongs+Instance" column: other ways to tag the same word. */
  alternatives: string;
}

/** A chapter of TAHOT keyed by Hebrew verse number. */
export type TahotChapter = Record<string, TahotWord[]>;

/**
 * One entry of STEPBible's augmented_strongs.txt (STEPBible/step repository):
 * an augmented (disambiguated) Strong's number and the verses where it applies.
 */
export interface AugmentedStrong {
  /** e.g. "H1540H". */
  augmentedStrong: string;
  /**
   * References in the Hebrew Bible (OSIS, Hebrew numbering, English numbering in
   * brackets when different), each optionally followed by occurrence letters
   * (A = 1st occurrence of the Strong's number in the verse, B = 2nd, ...; a
   * "-" before the letters means every occurrence except those).
   * Empty when STEPBible gives "*" (the default).
   */
  references: string[];
  /** True when STEPBible gives "*": the default for its Strong's number. */
  isDefault: boolean;
}
