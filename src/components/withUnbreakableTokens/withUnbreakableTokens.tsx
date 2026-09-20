import type { ReactNode } from 'react';
import styles from './withUnbreakableTokens.module.css';

// Compact tokens like "1–9", "3×3", or "A–G" read as single words, but the
// en dash and hyphen are break-after opportunities, so a narrow container
// can split them across lines ("1–" / "9"). Segments are capped at three
// characters so real hyphenated words ("pinwheel-shaped") keep their normal
// wrapping behavior.
const TOKEN = /([0-9A-Za-z]{1,3}(?:[–×-][0-9A-Za-z]{1,3})+)/;

export function withUnbreakableTokens(text: string): ReactNode[] {
  // A capturing group makes split() interleave tokens at odd indices.
  return text.split(TOKEN).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className={styles.noWrap}>
        {part}
      </span>
    ) : (
      part
    )
  );
}
