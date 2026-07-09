import { useEffect, useState } from 'react';
import type { Variant } from '@/engine/types';
import { resolveLayout } from './layouts/registry';

export function useResponsiveCellSize(variant: Variant): number {
  const base = resolveLayout(variant.layout.kind).baseCellSize(variant);

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
