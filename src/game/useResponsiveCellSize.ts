import { useEffect, useState } from 'react';
import type { Variant } from '@/engine/types';

function getBaseCellSize(variant: Variant): number {
  const kind = variant.layout.kind;
  if (kind === 'grid') {
    const size = (variant.layout as { size: number }).size;
    if (size === 16) return 30;
    return 52;
  }
  if (kind === 'multigrid') {
    const cols = (variant.layout as { canvasCols: number }).canvasCols;
    if (cols === 21) return 30;
    if (cols === 15) return 30;
    if (cols === 12) return 40;
    return Math.floor(400 / cols);
  }
  return 52;
}

function isClassicGrid(variant: Variant): boolean {
  return variant.layout.kind === 'grid' && (variant.layout as { size: number }).size === 9;
}

// Absolute cell sizes for the classic 9×9 board, each sized so that
// `9 × cell + 6px` (3px frame per side) fits the smallest viewport in its
// bucket down to the 320px baseline. See the mobile-9x9-fit design spec.
function classicCellSize(): number {
  const w = window.innerWidth;
  if (w <= 359) return 34;
  if (w <= 413) return 38;
  if (w <= 519) return 44;
  return 52;
}

export function useResponsiveCellSize(variant: Variant): number {
  const base = getBaseCellSize(variant);
  const classic = isClassicGrid(variant);

  function compute(): number {
    if (classic) return classicCellSize();
    const w = window.innerWidth;
    if (w <= 375) return Math.round(base * (38 / 52));
    if (w <= 520) return Math.round(base * (44 / 52));
    return base;
  }

  const [cellSize, setCellSize] = useState(compute);

  useEffect(() => {
    function onResize() {
      setCellSize(compute());
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, classic]);

  return cellSize;
}
