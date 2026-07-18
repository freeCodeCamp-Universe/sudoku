import type { Values, SymbolValue } from '@/engine/types';

export function findOverusedSymbols(
  values: Values,
  solution: Values,
  symbols: SymbolValue[]
): Set<SymbolValue> {
  const requiredCounts = new Map<SymbolValue, number>();
  for (const value of solution.values()) {
    requiredCounts.set(value, (requiredCounts.get(value) ?? 0) + 1);
  }

  const placedCounts = new Map<SymbolValue, number>();
  for (const value of values.values()) {
    placedCounts.set(value, (placedCounts.get(value) ?? 0) + 1);
  }

  // A symbol absent from the solution has no known requirement, so it can never
  // be "overused" (Infinity guard) — this keeps degenerate/partial solutions
  // from flagging every placement.
  return new Set(
    symbols.filter((symbol) => {
      const required = requiredCounts.get(symbol) ?? Infinity;
      const placed = placedCounts.get(symbol) ?? 0;
      return placed > required;
    })
  );
}
