import { gridLayout } from './grid';
import type { LayoutStrategy } from '@/game/gameTypes';

export const layouts: Record<string, LayoutStrategy> = {
  grid: gridLayout,
};

export function resolveLayout(kind: string): LayoutStrategy {
  const strategy = layouts[kind];

  if (!strategy) {
    throw new Error(`Unknown layout kind: ${kind}`);
  }

  return strategy;
}
