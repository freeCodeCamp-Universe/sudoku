import type React from 'react';
import type { SymbolValue } from '@/engine/types';
import styles from './Cell.module.css';

interface CellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  id: string;
  value?: SymbolValue;
  candidates: SymbolValue[];
  given: boolean;
  selected: boolean;
  conflict: boolean;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  renderSymbol: (value: SymbolValue) => string;
}

function parseCellCoordinates(id: string): { row: number; col: number } {
  const match = /^r(\d+)c(\d+)$/.exec(id);

  if (!match) {
    return { row: -1, col: -1 };
  }

  return {
    row: Number(match[1]),
    col: Number(match[2]),
  };
}

export function Cell({
  id,
  value,
  candidates,
  given,
  selected,
  conflict,
  onClick,
  renderSymbol,
  className,
  ...rest
}: CellProps) {
  const { row, col } = parseCellCoordinates(id);

  return (
    <div
      role="gridcell"
      data-cell={id}
      data-row={row >= 0 ? row : undefined}
      data-col={col >= 0 ? col : undefined}
      data-given={given || undefined}
      data-selected={selected || undefined}
      data-conflict={conflict || undefined}
      aria-selected={selected || undefined}
      aria-readonly={given || undefined}
      className={[styles.cell, className].filter(Boolean).join(' ')}
      onClick={onClick}
      {...rest}
    >
      {value !== undefined ? (
        <span aria-hidden="true" className={styles.value}>
          {renderSymbol(value)}
        </span>
      ) : candidates.length > 0 ? (
        <div aria-hidden="true" className={styles.candidates}>
          {Array.from({ length: 9 }, (_, index) => index + 1).map((candidate) => (
            <span key={candidate} className={styles.candidate}>
              {candidates.includes(candidate as SymbolValue)
                ? renderSymbol(candidate as SymbolValue)
                : ''}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
