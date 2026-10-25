# @metaxia/scriptures-source-stepbible-tahot

It is a data source for [GematriaBible.com](https://gematriabible.com) — an interlinear Bible with gematria values and Strong's numbers.

[STEPBible](https://www.stepbible.org/)'s **TAHOT** (Translators Amalgamated Hebrew OT) for use with
[@metaxia/scriptures](https://github.com/metaxiamultimedia/scriptures-js): every word of the Hebrew Old
Testament with STEPBible's own disambiguated Strong's tags (dStrong) for its prefixes, root and suffixes,
plus STEPBible's augmented Strong's table.

Use the dStrong with [`@metaxia/scriptures-source-stepbible-lexicon`](https://github.com/metaxiamultimedia/scriptures-js-source-stepbible-lexicon)'s
`lookupDStrong()` to get the TBESH row (gloss, meaning) STEPBible means for that word.

## Installation

```bash
npm install @metaxia/scriptures-source-stepbible-tahot
```

## Usage

```typescript
import { getVerseWords, resolveAugmentedStrong } from '@metaxia/scriptures-source-stepbible-tahot';

// Words are filed under the Hebrew reference (Deut 29:28 = English 29:29).
const words = await getVerseWords('Deut', 29, 28);
words[3];
// {
//   ref: 'Deu.29.29(29.28)#04=L', book: 'Deut', chapter: 29, verse: 29, hebrewChapter: 29, hebrewVerse: 28,
//   word: '04', type: 'L', hebrew: 'וְ/הַ/נִּגְלֹ֞ת', translation: 'but the/ [things] revealed',
//   dStrongs: 'H9002/H9009/{H1540H}', prefixes: ['H9002', 'H9009'], roots: ['H1540H'], suffixes: [],
//   punctuation: [], grammar: 'HC/Td/VNrfpa', rootInstance: 'H1540H', alternatives: '', ...
// }

// STEPBible's fallback for a simple Strong's number at a verse and occurrence
resolveAugmentedStrong('H1540', 'Deut.29.28', 1); // { dStrong: 'H1540H', via: 'reference' }
```

## Data

- `data/stepbible-tahot/<Book>/<hebrewChapter>.json`: TAHOT words keyed by Hebrew verse number, in
  file order. Book codes are OSIS (`Gen`, `Exod`, ..., `Ps`, ..., `Mal`). Each word (`TahotWord`) has
  every TAHOT column except "Conjoin word" (not yet implemented by STEPBible) and "Expanded Strong tags"
  (the dStrongs again with lexicon glosses): reference, word number (`word`, as written, e.g. `"08"`, or
  `"0501"` for words TAHOT adds from the LXX), text type (`L`, `Q(K)`, `X`, ...), Hebrew,
  transliteration, translation, dStrongs (as written and split into `prefixes`, `roots`, `suffixes`,
  `punctuation`), grammar, meaning and spelling variants, root dStrong + instance (`rootInstance`) and
  alternative Strong's + instance (`alternatives`). Columns are trimmed of surrounding whitespace.
- `data/stepbible-augmented-strongs.json`: the Hebrew entries of `augmented_strongs.txt`, the table the
  STEPBible software uses to pick a dStrong for a simple Strong's number at a verse
  (`resolveAugmentedStrong()` follows its `StrongAugmentationServiceImpl`).

TAHOT word numbers count the words of the Ketiv text. A Qere row (`Q(K)`, `Q(k)`) has the number of the
Ketiv it replaces and records the Ketiv in its variants columns. See the field descriptions at the top
of each TAHOT file and [TinyURL.com/UpgradingTags](https://tinyurl.com/UpgradingTags).

## Building from source

```bash
npm run import   # download TAHOT and augmented_strongs.txt at the pinned commits, write data/
npm run build
npm test
```

Pinned: STEPBible-Data `be4191f0082aeedddb0eff0c02c966292b2bd641`; STEPBible/step
`5ffb379899d76aafca4bb505bf160fe09c39684c`.

## License & attribution

- **Code:** MIT.
- **TAHOT data:** **CC BY 4.0**, not relicensed. Data created by [STEPBible.org](https://www.stepbible.org/)
  based on work at Tyndale House, Cambridge.
  Source: <https://github.com/STEPBible/STEPBible-Data>. Please send data corrections to STEPBible.
- **augmented_strongs data:** BSD 3-Clause, © 2012 STEPBible. Source: <https://github.com/STEPBible/step>.

When using this data, please attribute:

> Hebrew word tagging from TAHOT by [STEPBible.org](https://www.stepbible.org/), based on work at Tyndale House, Cambridge. Licensed under CC BY 4.0.

See [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE), including the changes made to the data.

## Related Packages

- [@metaxia/scriptures](https://github.com/metaxiamultimedia/scriptures-js) - Core scripture library
- [@metaxia/scriptures-source-stepbible-lexicon](https://github.com/metaxiamultimedia/scriptures-js-source-stepbible-lexicon) - TBESH/TBESG rows by dStrong
- [@metaxia/scriptures-source-openscriptures-ohb](https://github.com/metaxiamultimedia/scriptures-js-source-openscriptures-ohb) - Open Hebrew Bible
