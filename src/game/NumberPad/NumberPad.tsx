import type { SymbolValue } from '@/engine/types';
import styles from './NumberPad.module.css';

interface NumberPadProps {
  symbols: SymbolValue[];
  usedSymbols: Set<SymbolValue>;
  onEnter: (value: SymbolValue | 0) => void;
  candidateMode: boolean;
  columns?: number;
  renderSymbol?: (value: SymbolValue) => string;
  describeSymbol?: (value: SymbolValue) => string;
  symbolKind?: 'digit' | 'letter' | 'color';
}

export function NumberPad({
  symbols,
  usedSymbols,
  onEnter,
  candidateMode,
  columns,
  renderSymbol = (value) => String(value),
  describeSymbol = renderSymbol,
  symbolKind = 'digit',
}: NumberPadProps) {
  const cols = columns ?? Math.ceil(symbols.length / 2);
  const rows: SymbolValue[][] = [];
  for (let i = 0; i < symbols.length; i += cols) {
    rows.push(symbols.slice(i, i + cols));
  }

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
                <span aria-hidden="true" className={styles.colorChip} data-color={symbol}>
                  <span className={styles.colorLabel}>{symbol}</span>
                </span>
              ) : (
                renderSymbol(symbol)
              )}
            </button>
          ))}
          {index === rows.length - 1 && !columns ? (
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
      {columns ? (
        <div className={styles.numpadRow}>
          <button
            type="button"
            className={`${styles.numBtn} ${styles.erase} ${styles.eraseFullWidth}`}
            aria-label="Erase"
            onClick={() => onEnter(0)}
          >
            Erase
          </button>
        </div>
      ) : null}
    </div>
  );
}
