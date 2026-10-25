import { describe, it, expect } from 'vitest';
import { parseDStrongs, parseWordLine, parseAugmentedStrongs } from './import.js';

// Lines copied verbatim from TAHOT at the pinned STEPBible-Data commit
// (trailing columns shortened).
const GEN_1_1_01 = 'Gen.1.1#01=L\tבְּ/רֵאשִׁ֖ית\tbe./re.Shit\tin/ beginning\tH9003/{H7225G}\tHR/Ncfsa\t\t\tH7225G\t\t\tH9003=ב=in/{H7225G=רֵאשִׁית=: beginning»first:1_beginning}';
const DEU_29_28_04 = 'Deu.29.29(29.28)#04=L\tוְ/הַ/נִּגְלֹ֞ת\tve./ha./nig.Lot\tbut the/ [things] revealed\tH9002/H9009/{H1540H}\tHC/Td/VNrfpa\t\t\tH1540H\t\t\t';
const GEN_8_17_14 = 'Gen.8.17#14=Q(k)\tהַיְצֵ֣א\thay.tze\'\tbring out\t{H3318H}\tHVhv2ms\t\tL= הַוְצֵ֣א ¦ ;K= הוֹצֵא\tH3318H\t\t\t';

describe('parseDStrongs', () => {
  it('splits prefixes, root, suffixes and punctuation', () => {
    expect(parseDStrongs('H9002/H9009/{H0776G}\\H9016')).toMatchObject({
      prefixes: ['H9002', 'H9009'], roots: ['H0776G'], suffixes: [], punctuation: ['H9016'],
    });
    expect(parseDStrongs('{H5971A}/H9020')).toMatchObject({ prefixes: [], roots: ['H5971A'], suffixes: ['H9020'] });
    expect(parseDStrongs('H9005/{H9035}')).toMatchObject({ prefixes: ['H9005'], roots: ['H9035'], suffixes: [] });
    expect(parseDStrongs('{H0935G}//{H1409}').roots).toEqual(['H0935G', 'H1409']);
    expect(parseDStrongs('H9003/{H9032}\\H9016\\ \\H9018').punctuation).toEqual(['H9016', 'H9018']);
    expect(parseDStrongs('{H0430G}+').tags).toEqual([{ tag: 'H0430G', root: true, coversNext: true }]);
  });
});

describe('parseWordLine', () => {
  it('keeps the STEPBible columns and files the word under the Hebrew reference', () => {
    const w = parseWordLine(DEU_29_28_04)!;
    expect(w).toMatchObject({
      book: 'Deut', chapter: 29, verse: 29, hebrewChapter: 29, hebrewVerse: 28, word: '04', type: 'L',
      ref: 'Deu.29.29(29.28)#04=L', hebrew: 'וְ/הַ/נִּגְלֹ֞ת', dStrongs: 'H9002/H9009/{H1540H}',
      prefixes: ['H9002', 'H9009'], roots: ['H1540H'], suffixes: [], grammar: 'HC/Td/VNrfpa', rootInstance: 'H1540H',
    });
    expect(parseWordLine(GEN_1_1_01)).toMatchObject({ hebrewChapter: 1, hebrewVerse: 1, roots: ['H7225G'], prefixes: ['H9003'] });
  });

  it('keeps Qere/Ketiv variants as written', () => {
    const w = parseWordLine(GEN_8_17_14)!;
    expect(w.type).toBe('Q(k)');
    expect(w.spellingVariants).toBe('L= הַוְצֵ֣א ¦ ;K= הוֹצֵא');
  });

  it('ignores interlinear and header lines', () => {
    expect(parseWordLine('# Gen.1.1\tbe.re.Shit (בְּרֵאשִׁ֖ית)')).toBeUndefined();
    expect(parseWordLine('#_Translation\tin/ beginning')).toBeUndefined();
    expect(parseWordLine('Eng (Heb) Ref & Type\tHebrew')).toBeUndefined();
  });
});

describe('parseAugmentedStrongs', () => {
  it('reads Hebrew entries with their references and the * default', () => {
    const parsed = parseAugmentedStrongs([
      '===============================', '@AugmentedStrong=\tG0007G', '@References=\t*', '@LXXRefs=\t*',
      '===============================', '@AugmentedStrong=\tH1540G', '@References=\t*',
      '===============================', '@AugmentedStrong=\tH1540H', '@References=\tGen.35.7 Deut.29.28(29.29) 1Sam.2.27A',
    ].join('\n'));
    expect(Object.keys(parsed)).toEqual(['H1540G', 'H1540H']);
    expect(parsed.H1540G).toEqual({ augmentedStrong: 'H1540G', references: [], isDefault: true });
    expect(parsed.H1540H.references).toEqual(['Gen.35.7', 'Deut.29.28(29.29)', '1Sam.2.27A']);
  });
});
