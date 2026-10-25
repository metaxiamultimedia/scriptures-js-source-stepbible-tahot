/**
 * Import script for STEPBible TAHOT (Translators Amalgamated Hebrew OT).
 *
 * Downloads the four TAHOT files from STEPBible-Data and augmented_strongs.txt
 * from the STEPBible software repository, both at pinned commits, and writes:
 *
 *   data/stepbible-tahot/<Book>/<hebrewChapter>.json   words keyed by Hebrew verse
 *   data/stepbible-augmented-strongs.json              Hebrew entries of augmented_strongs.txt
 *
 * Every word row is kept, with every column except "Conjoin word" (not yet
 * implemented by STEPBible) and "Expanded Strong tags" (a copy of the dStrongs
 * with glosses, which belong to the lexicon).
 *
 * Usage: npm run import
 */

import { mkdir, writeFile, readFile, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { AugmentedStrong, TahotChapter, TahotWord } from '../src/types.js';
import { parseDStrongs } from '../src/dstrongs.js';

export { parseDStrongs };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const DATA_DIR = join(ROOT_DIR, 'data');
const SOURCE_DIR = join(ROOT_DIR, 'source');

/** STEPBible-Data commit for reproducible imports. */
export const STEPBIBLE_DATA_COMMIT = 'be4191f0082aeedddb0eff0c02c966292b2bd641';

/** STEPBible/step (software) commit for augmented_strongs.txt. */
export const STEPBIBLE_STEP_COMMIT = '5ffb379899d76aafca4bb505bf160fe09c39684c';

const TAHOT_PARTS = ['Gen-Deu', 'Jos-Est', 'Job-Sng', 'Isa-Mal'];

export const TAHOT_FILES = TAHOT_PARTS.map((part) => {
  const filename = `TAHOT ${part} - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt`;
  return {
    filename,
    url:
      `https://raw.githubusercontent.com/STEPBible/STEPBible-Data/${STEPBIBLE_DATA_COMMIT}/` +
      encodeURIComponent('Translators Amalgamated OT+NT') + '/' + encodeURIComponent(filename),
  };
});

export const AUGMENTED_STRONGS_FILE = {
  filename: 'augmented_strongs.txt',
  url:
    `https://raw.githubusercontent.com/STEPBible/step/${STEPBIBLE_STEP_COMMIT}/` +
    'step-core-data/src/main/resources/com/tyndalehouse/step/core/data/create/augmentedStrongs/augmented_strongs.txt',
};

/** TAHOT book abbreviations -> OSIS codes used by the @metaxia/scriptures sources. */
export const BOOKS: Record<string, string> = {
  Gen: 'Gen', Exo: 'Exod', Lev: 'Lev', Num: 'Num', Deu: 'Deut', Jos: 'Josh', Jdg: 'Judg', Rut: 'Ruth',
  '1Sa': '1Sam', '2Sa': '2Sam', '1Ki': '1Kgs', '2Ki': '2Kgs', '1Ch': '1Chr', '2Ch': '2Chr', Ezr: 'Ezra',
  Neh: 'Neh', Est: 'Esth', Job: 'Job', Psa: 'Ps', Pro: 'Prov', Ecc: 'Eccl', Sng: 'Song', Isa: 'Isa',
  Jer: 'Jer', Lam: 'Lam', Ezk: 'Ezek', Dan: 'Dan', Hos: 'Hos', Jol: 'Joel', Amo: 'Amos', Oba: 'Obad',
  Jon: 'Jonah', Mic: 'Mic', Nam: 'Nah', Hab: 'Hab', Zep: 'Zeph', Hag: 'Hag', Zec: 'Zech', Mal: 'Mal',
};

const REF = /^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)(?:\((\d+)\.(\d+)\))?#(\d+)=(.+)$/;

/** Parse one TAHOT word row. Returns undefined for any other line. */
export function parseWordLine(line: string): TahotWord | undefined {
  const cols = line.replace(/\r$/, '').split('\t');
  const match = REF.exec(cols[0]);
  if (!match || cols.length < 10) return undefined;
  const [, abbrev, ch, vs, hch, hvs, word, type] = match;
  const book = BOOKS[abbrev];
  if (!book) throw new Error(`Unknown TAHOT book: ${abbrev} in ${cols[0]}`);
  const col = (i: number) => (cols[i] ?? '').trim();
  const { prefixes, roots, suffixes, punctuation } = parseDStrongs(col(4));
  return {
    book,
    chapter: Number(ch),
    verse: Number(vs),
    hebrewChapter: Number(hch ?? ch),
    hebrewVerse: Number(hvs ?? vs),
    word,
    type,
    ref: cols[0],
    hebrew: col(1),
    transliteration: col(2),
    translation: col(3),
    dStrongs: col(4),
    prefixes,
    roots,
    suffixes,
    punctuation,
    grammar: col(5),
    meaningVariants: col(6),
    spellingVariants: col(7),
    rootInstance: col(8),
    alternatives: col(9),
  };
}

/** Parse the Hebrew (@References) entries of augmented_strongs.txt. */
export function parseAugmentedStrongs(content: string): Record<string, AugmentedStrong> {
  const out: Record<string, AugmentedStrong> = {};
  let current: string | undefined;
  for (const raw of content.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (line.startsWith('@AugmentedStrong=\t')) {
      current = line.slice('@AugmentedStrong=\t'.length).trim();
      continue;
    }
    if (line.startsWith('@References=\t') && current?.startsWith('H')) {
      if (out[current]) throw new Error(`duplicate augmented strong ${current}`);
      const refs = line.slice('@References=\t'.length).trim();
      const isDefault = refs.includes('*');
      out[current] = {
        augmentedStrong: current,
        references: refs.split(/\s+/).filter((r) => r && r !== '*'),
        isDefault,
      };
    }
  }
  return out;
}

async function cached(file: { filename: string; url: string }): Promise<string> {
  const path = join(SOURCE_DIR, file.filename);
  try {
    return await readFile(path, 'utf-8');
  } catch {
    console.log(`  Downloading: ${file.url}`);
    const response = await fetch(file.url);
    if (!response.ok) throw new Error(`Failed to download ${file.url}: ${response.statusText}`);
    const text = await response.text();
    await writeFile(path, text, 'utf-8');
    return text;
  }
}

async function main(): Promise<void> {
  console.log('STEPBible TAHOT Import');
  console.log('======================\n');
  await mkdir(SOURCE_DIR, { recursive: true });
  const outDir = join(DATA_DIR, 'stepbible-tahot');
  await rm(outDir, { recursive: true, force: true });

  // book -> hebrewChapter -> hebrewVerse -> words
  const books = new Map<string, Map<number, TahotChapter>>();
  let words = 0;
  for (const file of TAHOT_FILES) {
    const content = await cached(file);
    for (const line of content.split('\n')) {
      const w = parseWordLine(line);
      if (!w) continue;
      words++;
      const chapters = books.get(w.book) ?? new Map<number, TahotChapter>();
      books.set(w.book, chapters);
      const chapter = chapters.get(w.hebrewChapter) ?? {};
      chapters.set(w.hebrewChapter, chapter);
      (chapter[String(w.hebrewVerse)] ||= []).push(w);
    }
  }

  for (const [book, chapters] of books) {
    await mkdir(join(outDir, book), { recursive: true });
    for (const [ch, chapter] of chapters) {
      await writeFile(join(outDir, book, `${ch}.json`), JSON.stringify(chapter) + '\n', 'utf-8');
    }
  }
  console.log(`  ${words} words in ${books.size} books`);

  const augmented = parseAugmentedStrongs(await cached(AUGMENTED_STRONGS_FILE));
  await writeFile(
    join(DATA_DIR, 'stepbible-augmented-strongs.json'),
    JSON.stringify(augmented, null, 1) + '\n',
    'utf-8',
  );
  console.log(`  ${Object.keys(augmented).length} Hebrew augmented Strong's entries`);
  console.log('Done!');
}

if (process.argv[1]?.includes('import.ts') || process.argv[1]?.includes('import.js')) {
  main().catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
}
