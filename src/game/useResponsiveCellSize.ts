import { useEffect, useState } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import type { Variant } from '@/engine/types';
import { COMFORTABLE_CELL_SIZE } from './boardViewport';
import {
  boardFrameWidth,
  CELL_SIZE_STEPS,
  GUTTER_SIZE,
  VIEWPORT_BUCKET_FLOORS,
  VIEWPORT_DESKTOP,
} from './layouts/cellSizes';
import { resolveLayout } from './layouts/registry';

function isOversizedVariant(variant: Variant): boolean {
  const { kind } = variant.layout;
  if (kind === 'multigrid') return true;
  if (kind === 'grid') return (variant.layout as { size: number }).size > 9;
  return false;
}

// The bucket floor is the guaranteed minimum viewport width for the current
// bucket, so a size fitted against it holds for every viewport in the bucket.
function bucketFloor(width: number): number {
  const smallest = VIEWPORT_BUCKET_FLOORS[VIEWPORT_BUCKET_FLOORS.length - 1];
  return VIEWPORT_BUCKET_FLOORS.find((floor) => width >= floor) ?? smallest;
}

export function useResponsiveCellSize(variant: Variant): number {
  const layout = resolveLayout(variant.layout.kind);
  const base = layout.baseCellSize(variant);
  const oversized = isOversizedVariant(variant);
  const { highContrast } = useTheme();

  function compute(): number {
    if (oversized) {
      // TODO: desktop oversized boards will get the mobile treatment in a
      // follow-up branch: show the full board shrunk to fit, with zoom and
      // fit controls. Until then desktop keeps the base sizes from main.
      // return COMFORTABLE_CELL_SIZE;
      if (window.innerWidth < VIEWPORT_DESKTOP) return COMFORTABLE_CELL_SIZE;
      return base;
    }

    if (window.innerWidth >= VIEWPORT_DESKTOP) {
      return base;
    }

    const floor = bucketFloor(window.innerWidth);
    const frame = boardFrameWidth(highContrast);
    // Clue-gutter variants render a gutter column (or matching corner) on
    // both inline sides of the canvas, so the fit must budget for them.
    const gutterExtent = variant.deriveGutters || layout.gutters ? 2 * GUTTER_SIZE : 0;
    const fitted = CELL_SIZE_STEPS.find(
      (step) => step <= base && layout.canvasSize(variant, step).w + frame + gutterExtent <= floor
    );
    return fitted ?? CELL_SIZE_STEPS[CELL_SIZE_STEPS.length - 1];
  }

  const [cellSize, setCellSize] = useState(compute);

  useEffect(() => {
    setCellSize(compute());
    function onResize() {
      setCellSize(compute());
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, oversized, variant, highContrast]);

  return cellSize;
}
