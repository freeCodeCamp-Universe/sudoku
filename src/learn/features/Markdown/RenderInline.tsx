import type { ReactNode } from 'react';

// Double-backtick spans (``...``) must appear before single-backtick spans in
// the alternation so a leading `` `` `` is not consumed as the start of a
// single-backtick span. The double-backtick content pattern allows inner single
// backticks as long as they are not immediately followed by another backtick
// (which would begin the closing delimiter).
const INLINE = /(<kbd>[^<]*<\/kbd>|\*\*[^*]+\*\*|_[^_]+_|``(?:[^`]|`(?!`))+``|`[^`]+`)/g;

export function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, index) => {
    if (part.startsWith('<kbd>') && part.endsWith('</kbd>')) {
      return <kbd key={index}>{part.slice(5, -6)}</kbd>;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('_') && part.endsWith('_')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('``') && part.endsWith('``')) {
      return <code key={index}>{part.slice(2, -2)}</code>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
