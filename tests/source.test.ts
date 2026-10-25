import { describe, it, expect } from 'vitest';
import {
  getVerseWords, getVerseWordsSync, loadChapter, augmentedStrongsFor, defaultAugmentedStrong,
  parseAugmentedReference, resolveAugmentedStrong, metadata,
} from '../src/index.js';

describe('TAHOT data', () => {
  it('files words under the Hebrew reference (Deut 29:28 = English 29:29)', async () => {
    const words = await getVerseWords('Deut', 29, 28);
    expect(words).toHaveLength(14);
    const w = words[3];
    expect(w.ref).toBe('Deu.29.29(29.28)#04=L');
    expect(w.roots).toEqual(['H1540H']);
    expect(w.prefixes).toEqual(['H9002', 'H9009']);
    const lanu = words[4];
    expect(lanu.prefixes).toEqual(['H9005']);
    expect(lanu.roots).toEqual(['H9035']);
  });

  it('the five example words carry STEPBible\'s dStrong', () => {
    const root = (b: string, c: number, v: number, word: string) =>
      getVerseWordsSync(b, c, v).find((w) => w.word === word)!.roots;
    expect(root('1Kgs', 10, 28, '02')).toEqual(['H5483M']);
    expect(root('Ps', 117, 1, '01')).toEqual(['H1984B']);
    expect(root('Gen', 12, 1, '09')).toEqual(['H1004M']);
    expect(root('Exod', 3, 7, '07')).toEqual(['H5971A']);
  });

  it('keeps every row of the four TAHOT files', async () => {
    const { readdirSync } = await import('fs');
    const { join } = await import('path');
    const { dataPath } = await import('../src/source.js');
    let count = 0;
    for (const book of readdirSync(dataPath)) {
      for (const file of readdirSync(join(dataPath, book))) {
        const chapter = (await loadChapter(book, parseInt(file, 10)))!;
        for (const words of Object.values(chapter)) count += words.length;
      }
    }
    expect(readdirSync(dataPath)).toHaveLength(39);
    expect(count).toBe(305648);
  });

  it('returns no words for a verse TAHOT does not have', async () => {
    expect(await getVerseWords('Mal', 4, 1)).toEqual([]);
  });

  it('credits STEPBible under CC BY 4.0', () => {
    expect(metadata.license).toBe('CC BY 4.0');
    expect(metadata.source).toMatch(/STEPBible\.org/);
  });
});

describe('augmented_strongs.txt', () => {
  it('splits references as StrongAugmentationServiceImpl does for the Hebrew text', () => {
    expect(parseAugmentedReference('Deut.29.28(29.29)')).toEqual({ osisRef: 'Deut.29.28', occurrences: undefined, except: false });
    expect(parseAugmentedReference('1Sam.2.27A')).toEqual({ osisRef: '1Sam.2.27', occurrences: new Set([1]), except: false });
    expect(parseAugmentedReference('Ps.75.5(75.4)B')).toEqual({ osisRef: 'Ps.75.5', occurrences: new Set([2]), except: false });
    expect(parseAugmentedReference('Gen.1.1-AB').except).toBe(true);
  });

  it('takes the * entry as the default, else the entry with most references', () => {
    expect(defaultAugmentedStrong('H1540')).toBe('H1540G');
    expect(defaultAugmentedStrong('H5483')).toBe('H5483A');
    expect(augmentedStrongsFor('H5483').map((e) => e.augmentedStrong)).toEqual(['H5483A', 'H5483B', 'H5483M']);
  });

  it('resolves a listed verse, else the default', () => {
    expect(resolveAugmentedStrong('H1540', 'Deut.29.28', 1)).toEqual({ dStrong: 'H1540H', via: 'reference' });
    expect(resolveAugmentedStrong('H5483', '1Kgs.10.28', 1)).toEqual({ dStrong: 'H5483M', via: 'reference' });
    expect(resolveAugmentedStrong('H1540', 'Gen.1.1', 1)).toEqual({ dStrong: 'H1540G', via: 'default' });
    expect(resolveAugmentedStrong('H1004', 'Gen.17.23', 2)).toEqual({ dStrong: 'H1004M', via: 'reference' });
    expect(resolveAugmentedStrong('H0001', 'Gen.1.1', 1).via).not.toBe('reference');
  });
});
