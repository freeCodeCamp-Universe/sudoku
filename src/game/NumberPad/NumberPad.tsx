import type { SymbolValue } from '@/engine/types';
import styles from './NumberPad.module.css';

interface NumberPadProps {
  symbols: SymbolValue[];
  usedSymbols: Set<SymbolValue>;
  onEnter: (value: SymbolValue | 0) => void;
  candidateMode: boolean;
  renderSymbol?: (value: SymbolValue) => string;
  describeSymbol?: (value: SymbolValue) => string;
  symbolKind?: 'digit' | 'letter' | 'color';
}

export function NumberPad({
  symbols,
  usedSymbols,
  onEnter,
  candidateMode,
  renderSymbol = (value) => String(value),
  describeSymbol = renderSymbol,
  symbolKind = 'digit',
}: NumberPadProps) {
  const half = Math.ceil(symbols.length / 2);
  const rows = [symbols.slice(0, half), symbols.slice(half)];

  return (
    <div className={`${styles.numpad}${candidateMode ? ` ${styles.candidate}` : ''}`}>
      {rows.map((row, index) => (
        <div key={index} className={styles.numpadRow}>
          {row.map((symbol) => (
            <button
              key={symbol}
              type="button"
              className={styles.numBtn}
              data-used={usedSymbols.has(symbol) || undefined}
              disabled={usedSymbols.has(symbol)}
              aria-label={describeSymbol(symbol)}
              onClick={() => onEnter(symbol)}
            >
              {symbolKind === 'color' ? (
                <span
                  aria-hidden="true"
                  className={styles.colorChip}
                  style={{ background: renderSymbol(symbol) }}
                >
                  <span className={styles.colorLabel}>{symbol}</span>
                </span>
              ) : (
                renderSymbol(symbol)
              )}
            </button>
          ))}
          {index === rows.length - 1 ? (
            <button
              type="button"
              className={`${styles.numBtn} ${styles.erase}`}
              aria-label="Erase"
              onClick={() => onEnter(0)}
            >
              Erase
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
