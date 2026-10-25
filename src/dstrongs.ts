import type { TahotTag, TahotWord } from './types.js';

/**
 * Parse TAHOT's dStrongs column. "/" separates prefixes, root and suffixes
 * (the root in {curly brackets}); "\" separates punctuation; "+" after a tag
 * means it also covers the next word.
 */
export function parseDStrongs(
  field: string,
): { tags: TahotTag[] } & Pick<TahotWord, 'prefixes' | 'roots' | 'suffixes' | 'punctuation'> {
  const [wordPart, ...punctParts] = field.split('\\');
  const tags: TahotTag[] = [];
  for (const piece of wordPart.split('/')) {
    const token = piece.trim();
    if (!token) continue;
    const coversNext = token.endsWith('+');
    const bare = coversNext ? token.slice(0, -1) : token;
    const root = bare.startsWith('{') && bare.endsWith('}');
    tags.push({ tag: root ? bare.slice(1, -1) : bare, root, coversNext });
  }
  const first = tags.findIndex((t) => t.root);
  let last = -1;
  tags.forEach((t, i) => { if (t.root) last = i; });
  return {
    tags,
    prefixes: first === -1 ? tags.map((t) => t.tag) : tags.slice(0, first).map((t) => t.tag),
    roots: tags.filter((t) => t.root).map((t) => t.tag),
    suffixes: last === -1 ? [] : tags.slice(last + 1).map((t) => t.tag),
    punctuation: punctParts.map((p) => p.trim()).filter(Boolean),
  };
}

