import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { SymbolValue } from '@/engine/types';
import styles from './NumberPad.module.css';

type PadItem = { kind: 'symbol'; value: SymbolValue } | { kind: 'erase' };

const GRID_LABELS = {
  digit: 'Number pad',
  letter: 'Letter pad',
  color: 'Color pad',
} as const;

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
  const rows: PadItem[][] = [];
  for (let i = 0; i < symbols.length; i += cols) {
    rows.push(symbols.slice(i, i + cols).map((value) => ({ kind: 'symbol', value }) as PadItem));
  }
  if (columns) {
    rows.push([{ kind: 'erase' }]);
  } else {
    rows[rows.length - 1].push({ kind: 'erase' });
  }

  const [focused, setFocused] = useState<[number, number]>([0, 0]);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  // Clamp so the roving tab stop survives a symbols/columns change.
  const focusedRow = Math.min(focused[0], rows.length - 1);
  const focusedCol = Math.min(focused[1], rows[focusedRow].length - 1);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let row = focusedRow;
    let col = focusedCol;
    switch (event.key) {
      case 'ArrowRight':
        col += 1;
        break;
      case 'ArrowLeft':
        col -= 1;
        break;
      case 'ArrowDown':
        row += 1;
        break;
      case 'ArrowUp':
        row -= 1;
        break;
      case 'Home':
        col = 0;
        break;
      case 'End':
        col = rows[row].length - 1;
        break;
      default:
        return;
    }
    if (row < 0 || row >= rows.length) return;
    col = Math.min(Math.max(col, 0), rows[row].length - 1);
    if (row === focusedRow && col === focusedCol) return;
    event.preventDefault();
    setFocused([row, col]);
    buttonRefs.current.get(`${row},${col}`)?.focus();
  };

  return (
    <div
      className={`${styles.numpad}${candidateMode ? ` ${styles.candidate}` : ''}`}
      data-cols={columns}
      role="grid"
      aria-label={GRID_LABELS[symbolKind]}
      onKeyDown={handleKeyDown}
    >
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} role="row" className={styles.numpadRow}>
          {row.map((item, colIndex) => {
            const isRovingStop = rowIndex === focusedRow && colIndex === focusedCol;
            const sharedProps = {
              type: 'button' as const,
              tabIndex: isRovingStop ? 0 : -1,
              ref: (el: HTMLButtonElement | null) => {
                const key = `${rowIndex},${colIndex}`;
                if (el) buttonRefs.current.set(key, el);
                else buttonRefs.current.delete(key);
              },
              onFocus: () => setFocused([rowIndex, colIndex]),
            };
            if (item.kind === 'erase') {
              return (
                <div
                  key="erase"
                  role="gridcell"
                  className={`${styles.numCell}${columns ? ` ${styles.eraseFullWidth}` : ''}`}
                >
                  <button
                    {...sharedProps}
                    className={`${styles.numBtn} ${styles.erase}`}
                    aria-label="Erase"
                    onClick={() => onEnter(0)}
                  >
                    Erase
                  </button>
                </div>
              );
            }
            const symbol = item.value;
            const used = usedSymbols.has(symbol);
            return (
              <div key={symbol} role="gridcell" className={styles.numCell}>
                <button
                  {...sharedProps}
                  className={styles.numBtn}
                  data-used={used || undefined}
                  aria-disabled={used || undefined}
                  aria-label={describeSymbol(symbol)}
                  onClick={() => {
                    if (!used) onEnter(symbol);
                  }}
                >
                  {symbolKind === 'color' ? (
                    <span aria-hidden="true" className={styles.colorChip} data-color={symbol}>
                      <span className={styles.colorLabel}>{symbol}</span>
                    </span>
                  ) : (
                    renderSymbol(symbol)
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
