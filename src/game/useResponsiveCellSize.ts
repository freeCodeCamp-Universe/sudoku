import { useEffect, useState } from 'react';
import type { Variant } from '@/engine/types';
import {
  CELL_SIZE_STANDARD,
  CELL_SIZE_STANDARD_NARROW,
  CELL_SIZE_STANDARD_SMALL,
  VIEWPORT_NARROW,
  VIEWPORT_SMALL,
} from './layouts/cellSizes';
import { resolveLayout } from './layouts/registry';

export function useResponsiveCellSize(variant: Variant): number {
  const base = resolveLayout(variant.layout.kind).baseCellSize(variant);

  function compute(): number {
    const w = window.innerWidth;
    if (w <= VIEWPORT_NARROW) {
      return Math.round(base * (CELL_SIZE_STANDARD_NARROW / CELL_SIZE_STANDARD));
    }
    if (w <= VIEWPORT_SMALL) {
      return Math.round(base * (CELL_SIZE_STANDARD_SMALL / CELL_SIZE_STANDARD));
    }
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
