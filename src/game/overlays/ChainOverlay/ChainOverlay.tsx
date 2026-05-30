import type { CellId } from '@/engine/types';
import type { Chain } from '@/engine/constraints/chain';
import type { Rect } from '@/game/gameTypes';
import styles from './ChainOverlay.module.css';

interface ChainOverlayProps {
  rects: Map<CellId, Rect>;
  structure: unknown;
}

function getChains(structure: unknown): Chain[] {
  const chainStructure = structure as { chains?: Chain[] } | undefined;

  return chainStructure?.chains ?? [];
}

export function ChainOverlay({ rects, structure }: ChainOverlayProps) {
  const chains = getChains(structure);
  const allRects = [...rects.values()];

  if (chains.length === 0 || allRects.length === 0) {
    return null;
  }

  const maxX = Math.max(...allRects.map((rect) => rect.x + rect.w));
  const maxY = Math.max(...allRects.map((rect) => rect.y + rect.h));
  const strokeWidth = Math.max(4, Math.round((10 * allRects[0].w) / 52));

  return (
    <svg
      aria-hidden="true"
      data-testid="chain-overlay"
      className={styles.overlay}
      width={maxX}
      height={maxY}
      style={{ position: 'absolute', insetInlineStart: 0, insetBlockStart: 0 }}
    >
      {chains.map((chainDef, index) => {
        const points = chainDef.cells
          .map((cellId) => rects.get(cellId))
          .filter((rect): rect is Rect => rect !== undefined)
          .map((rect) => `${rect.x + rect.w / 2},${rect.y + rect.h / 2}`)
          .join(' ');

        if (!points) {
          return null;
        }

        return (
          <polyline
            key={`${chainDef.cells[0] ?? 'chain'}-${index}`}
            data-testid="chain-line"
            className={styles.line}
            points={points}
            stroke={chainDef.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}
