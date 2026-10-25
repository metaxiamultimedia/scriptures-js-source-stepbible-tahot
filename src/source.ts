/**
 * Data loading for STEPBible TAHOT and STEPBible's augmented Strong's table.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import type { AugmentedStrong, TahotChapter, TahotWord } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = join(__dirname, '..', 'data');
const TAHOT_PATH = join(DATA_PATH, 'stepbible-tahot');

export const metadata = {
  id: 'stepbible-tahot',
  name: 'TAHOT - Translators Amalgamated Hebrew OT',
  license: 'CC BY 4.0',
  source: 'STEPBible.org / Tyndale House, Cambridge',
  urls: ['https://github.com/STEPBible/STEPBible-Data', 'https://www.stepbible.org/'],
  augmentedStrongs: {
    name: 'augmented_strongs.txt (STEPBible software)',
    license: 'BSD-3-Clause',
    source: 'STEPBible.org',
    urls: ['https://github.com/STEPBible/step'],
  },
} as const;

/** Directory holding <Book>/<hebrewChapter>.json. */
export const dataPath = TAHOT_PATH;

const chapterCache = new Map<string, TahotChapter | null>();

/**
 * A chapter of TAHOT by OSIS book code (e.g. "Ps") and Hebrew chapter number,
 * keyed by Hebrew verse number; undefined when TAHOT has no such chapter.
 */
export function loadChapterSync(book: string, hebrewChapter: number): TahotChapter | undefined {
  const key = `${book}.${hebrewChapter}`;
  if (!chapterCache.has(key)) {
    const file = join(TAHOT_PATH, book, `${hebrewChapter}.json`);
    chapterCache.set(key, existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) : null);
  }
  return chapterCache.get(key) ?? undefined;
}

export async function loadChapter(book: string, hebrewChapter: number): Promise<TahotChapter | undefined> {
  const key = `${book}.${hebrewChapter}`;
  if (!chapterCache.has(key)) {
    try {
      const content = await readFile(join(TAHOT_PATH, book, `${hebrewChapter}.json`), 'utf-8');
      chapterCache.set(key, JSON.parse(content));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      chapterCache.set(key, null);
    }
  }
  return chapterCache.get(key) ?? undefined;
}

/**
 * The TAHOT words of a verse by Hebrew reference, in file order (word 01, 02,
 * ..., with LXX additions such as 0501 where TAHOT places them).
 */
export async function getVerseWords(book: string, hebrewChapter: number, hebrewVerse: number): Promise<TahotWord[]> {
  return (await loadChapter(book, hebrewChapter))?.[String(hebrewVerse)] ?? [];
}

export function getVerseWordsSync(book: string, hebrewChapter: number, hebrewVerse: number): TahotWord[] {
  return loadChapterSync(book, hebrewChapter)?.[String(hebrewVerse)] ?? [];
}

// ---------------------------------------------------------------------------
// Augmented Strong's (STEPBible/step augmented_strongs.txt)
// ---------------------------------------------------------------------------

let augmentedCache: Record<string, AugmentedStrong> | undefined;

/** Every Hebrew entry of augmented_strongs.txt, keyed by augmented Strong's number. */
export function loadAugmentedStrongsSync(): Record<string, AugmentedStrong> {
  augmentedCache ??= JSON.parse(readFileSync(join(DATA_PATH, 'stepbible-augmented-strongs.json'), 'utf-8'));
  return augmentedCache!;
}

/** The four-digit number of a Strong's tag: "H1540H" -> 1540, "H0853" -> 853. */
function strongNumber(tag: string): number {
  const match = /^[HG](\d+)/.exec(tag);
  if (!match) throw new Error(`Not a Strong's tag: ${tag}`);
  return Number(match[1]);
}

/** Entries of augmented_strongs.txt for one simple Strong's number (e.g. "H1540"), sorted by tag as STEPBible loads them. */
export function augmentedStrongsFor(sStrong: string): AugmentedStrong[] {
  const n = strongNumber(sStrong);
  return Object.values(loadAugmentedStrongsSync())
    .filter((entry) => strongNumber(entry.augmentedStrong) === n)
    .sort((a, b) => (a.augmentedStrong < b.augmentedStrong ? -1 : a.augmentedStrong > b.augmentedStrong ? 1 : 0));
}

/**
 * The default augmented Strong's number for a simple one, as STEPBible's
 * StrongAugmentationServiceImpl computes it: the entry whose references are
 * "*", otherwise the entry with the most references (the first in tag order
 * on a tie). Undefined when the number has no entries.
 */
export function defaultAugmentedStrong(sStrong: string): string | undefined {
  let best: AugmentedStrong | undefined;
  let bestCount = 0;
  for (const entry of augmentedStrongsFor(sStrong)) {
    const count = entry.isDefault ? Number.MAX_SAFE_INTEGER : entry.references.length;
    if (count > bestCount) {
      best = entry;
      bestCount = count;
    }
  }
  return best?.augmentedStrong;
}

/**
 * One reference of augmented_strongs.txt split as StrongAugmentationServiceImpl
 * reads it for the Hebrew (OHB) text: the Hebrew reference (before any
 * bracketed English one) and the occurrences it covers (A = 1st, ... I = 9th;
 * a "-" before the letters means every occurrence except those). `occurrences`
 * undefined means every occurrence in the verse.
 */
export function parseAugmentedReference(ref: string): { osisRef: string; occurrences?: Set<number>; except: boolean } {
  let end = ref.length;
  const letters: number[] = [];
  while (end > 0 && /[A-I]/.test(ref[end - 1].toUpperCase())) {
    letters.push(ref[end - 1].toUpperCase().charCodeAt(0) - 64);
    end--;
  }
  let except = false;
  if (letters.length > 0 && ref[end - 1] === '-') {
    except = true;
    end--;
  }
  let osisRef = ref.slice(0, end);
  const paren = osisRef.indexOf('(');
  if (paren > 0) osisRef = osisRef.slice(0, paren);
  return { osisRef, occurrences: letters.length ? new Set(letters) : undefined, except };
}

/** Result of resolving a simple Strong's number at a verse with augmented_strongs.txt. */
export interface AugmentedResolution {
  /** The augmented Strong's number, when STEPBible's table decides one. */
  dStrong?: string;
  /** "reference": the verse (and occurrence) is listed; "default": not listed, so the default applies; "none": no entries for this number. */
  via: 'reference' | 'default' | 'none';
  /** More than one non-default entry lists this verse and occurrence. */
  conflicting?: string[];
}

/**
 * Resolve a simple Strong's number (e.g. "H1540") at a Hebrew verse
 * ("Deut.29.28", OSIS with Hebrew numbering) for its nth occurrence in the
 * verse (1-based), following STEPBible's augmented_strongs.txt: a non-default
 * entry that lists the verse (and that occurrence, when letters are given),
 * otherwise the default entry.
 */
export function resolveAugmentedStrong(sStrong: string, osisRef: string, occurrence: number): AugmentedResolution {
  const entries = augmentedStrongsFor(sStrong);
  if (entries.length === 0) return { via: 'none' };
  const fallback = defaultAugmentedStrong(sStrong);
  const hits: string[] = [];
  for (const entry of entries) {
    if (entry.augmentedStrong === fallback) continue;
    for (const raw of entry.references) {
      const ref = parseAugmentedReference(raw);
      if (ref.osisRef !== osisRef) continue;
      const listed = ref.occurrences === undefined || ref.occurrences.has(occurrence);
      if (ref.except ? !listed : listed) {
        hits.push(entry.augmentedStrong);
        break;
      }
    }
  }
  if (hits.length === 1) return { dStrong: hits[0], via: 'reference' };
  if (hits.length > 1) return { via: 'reference', conflicting: hits };
  return { dStrong: fallback, via: 'default' };
}
