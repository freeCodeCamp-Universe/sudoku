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
      data-error={conflict || correct === false || undefined}
      data-same-value={sameValue || undefined}
      data-peer={peer || undefined}
      data-symbol-kind={symbolKind !== 'digit' ? symbolKind : undefined}
      data-box-right={boxBoundaryRight || undefined}
      data-box-bottom={boxBoundaryBottom || undefined}
      data-overlay-borders={overlayBorders || undefined}
      data-diagonal={diagonal || undefined}
      data-shaded={even || diagonal || girandola || undefined}
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
      data-colorblind={(colorblind && symbolKind === 'color') || undefined}
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
              data-color={value}
              data-testid="cell-color-chip"
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
    </div>
  );
}
