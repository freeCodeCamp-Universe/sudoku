import type { Values, SymbolValue } from '@/engine/types';

export function findUsedSymbols(
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

  // Strict equality keeps this mutually exclusive with findOverusedSymbols'
  // strict `>` check: a symbol is either exactly used up (this set) or placed
  // past that point (overused), never both.
  return new Set(
    symbols.filter((symbol) => {
      const required = requiredCounts.get(symbol) ?? Infinity;
      const placed = placedCounts.get(symbol) ?? 0;
      return placed === required;
    })
  );
}
