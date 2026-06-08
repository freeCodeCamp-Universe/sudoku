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

export function useResponsiveCellSize(variant: Variant): number {
  const base = getBaseCellSize(variant);

  function compute(): number {
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
  }, [base]);

  return cellSize;
}
