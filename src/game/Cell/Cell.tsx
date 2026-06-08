import type React from 'react';
import type { SymbolValue } from '@/engine/types';
import type { MarkerEdge } from '@/game/gameTypes';
import styles from './Cell.module.css';

interface CellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  id: string;
  value?: SymbolValue;
  candidates: SymbolValue[];
  symbols: SymbolValue[];
  given: boolean;
  revealed?: boolean;
  selected: boolean;
  conflict: boolean;
  correct?: boolean;
  sameValue?: boolean;
  peer?: boolean;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  renderSymbol: (value: SymbolValue) => string;
  symbolKind?: 'digit' | 'letter' | 'color';
  boxBoundaryRight?: boolean;
  boxBoundaryBottom?: boolean;
  overlayBorders?: boolean;
  overlap?: number;
  diagonal?: boolean;
  small?: boolean;
  medium?: boolean;
  butterfly?: boolean;
  cross?: boolean;
  flower?: boolean;
  window?: boolean;
  asterisk?: boolean;
  centerDot?: boolean;
  girandola?: boolean;
  argyleD1?: boolean;
  argyleD2?: boolean;
  markerEdges?: MarkerEdge[];
  word?: boolean;
  colorblind?: boolean;
  even?: boolean;
  odd?: boolean;
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
  symbols,
  given,
  revealed = false,
  selected,
  conflict,
  correct,
  sameValue = false,
  peer = false,
  onClick,
  renderSymbol,
  symbolKind = 'digit',
  boxBoundaryRight = false,
  boxBoundaryBottom = false,
  overlayBorders = false,
  overlap = 0,
  diagonal = false,
  small = false,
  medium = false,
  butterfly: isButterfly = false,
  cross: isCross = false,
  flower: isFlower = false,
  window: isWindow = false,
  asterisk = false,
  centerDot = false,
  girandola = false,
  argyleD1 = false,
  argyleD2 = false,
  markerEdges,
  word = false,
  colorblind = false,
  even = false,
  odd = false,
  className,
  ...rest
}: CellProps) {
  const { row, col } = parseCellCoordinates(id);
  const candidateColumns = Math.max(1, Math.ceil(Math.sqrt(symbols.length)));
  const overlapClass = overlap === 5 ? 'five' : overlap === 4 ? 'four' : overlap === 3 ? 'three' : overlap === 2 ? 'two' : undefined;

  return (
    <div
      role="gridcell"
      data-cell={id}
      data-row={row >= 0 ? row : undefined}
      data-col={col >= 0 ? col : undefined}
      data-given={given || undefined}
      data-revealed={revealed || undefined}
      data-selected={selected || undefined}
      data-conflict={conflict || undefined}
      data-correct={correct === true || undefined}
      data-incorrect={correct === false || undefined}
      data-same-value={sameValue || undefined}
      data-peer={peer || undefined}
      data-symbol-kind={symbolKind !== 'digit' ? symbolKind : undefined}
      data-box-right={boxBoundaryRight || undefined}
      data-box-bottom={boxBoundaryBottom || undefined}
      data-overlay-borders={overlayBorders || undefined}
      data-overlap={overlapClass}
      data-diagonal={diagonal || undefined}
      data-small={small || undefined}
      data-medium={medium || undefined}
      data-butterfly={isButterfly || undefined}
      data-cross={isCross || undefined}
      data-flower={isFlower || undefined}
      data-window={isWindow || undefined}
      data-asterisk={asterisk || undefined}
      data-center-dot={centerDot || undefined}
      data-girandola={girandola || undefined}
      data-argyle-d1={argyleD1 || undefined}
      data-argyle-d2={argyleD2 || undefined}
      data-word={word || undefined}
      data-even={even || undefined}
      data-odd={odd || undefined}
      data-colorblind={colorblind && symbolKind === 'color' || undefined}
      aria-selected={selected || undefined}
      aria-readonly={given || undefined}
      className={[styles.cell, className].filter(Boolean).join(' ')}
      onClick={onClick}
      {...rest}
    >
      {value !== undefined ? (
        symbolKind === 'color' ? (
          <>
            <span
              aria-hidden="true"
              className={styles.colorChip}
              data-color-chip
              data-testid="cell-color-chip"
              style={{ background: renderSymbol(value) }}
            />
            {colorblind && (
              <span aria-hidden="true" className={styles.colorLabel}>
                {value}
              </span>
            )}
            {given ? (
              <span aria-hidden="true" className={styles.givenDot} data-testid="cell-given-dot" />
            ) : revealed ? (
              <span
                aria-hidden="true"
                className={styles.revealedDot}
                data-testid="cell-revealed-dot"
              />
            ) : null}
          </>
        ) : (
          <span aria-hidden="true" className={styles.value}>
            {renderSymbol(value)}
          </span>
        )
      ) : candidates.length > 0 ? (
        <div
          aria-hidden="true"
          className={styles.candidates}
          style={{ '--candidate-columns': String(candidateColumns) } as React.CSSProperties}
        >
          {symbols.map((candidate) => (
            <span key={candidate} className={styles.candidate} data-testid="candidate-mark">
              {candidates.includes(candidate as SymbolValue)
                ? symbolKind === 'color'
                  ? String(candidate)
                  : renderSymbol(candidate as SymbolValue)
                : ''}
            </span>
          ))}
        </div>
      ) : null}
      {markerEdges?.map((edge) => (
        <span
          key={edge}
          aria-hidden="true"
          data-testid="marker-gap"
          data-edge={edge}
          className={styles.markerGap}
        />
      ))}
      {(conflict || correct === false) ? (
        <svg
          aria-hidden="true"
          className={styles.incorrectIcon}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
        >
          {/* !Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. */}
          <path d="M256 0c14.7 0 28.2 8.1 35.2 21l216 400c6.7 12.4 6.4 27.4-.8 39.5S486.1 480 472 480L40 480c-14.1 0-27.2-7.4-34.4-19.5s-7.5-27.1-.8-39.5l216-400c7-12.9 20.5-21 35.2-21zm0 352a32 32 0 1 0 0 64 32 32 0 1 0 0-64zm0-192c-18.2 0-32.7 15.5-31.4 33.7l7.4 104c.9 12.5 11.4 22.3 23.9 22.3 12.6 0 23-9.7 23.9-22.3l7.4-104c1.3-18.2-13.1-33.7-31.4-33.7z" />
        </svg>
      ) : null}
    </div>
  );
}
