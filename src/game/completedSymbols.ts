import type { Values, SymbolValue } from '@/engine/types';

export function findCompletedSymbols(
  values: Values,
  solution: Values,
  symbols: SymbolValue[]
): Set<SymbolValue> {
  const requiredCounts = new Map<SymbolValue, number>(symbols.map((symbol) => [symbol, 0]));
  for (const value of solution.values()) {
    requiredCounts.set(value, (requiredCounts.get(value) ?? 0) + 1);
  }

  const placedCounts = new Map<SymbolValue, number>(symbols.map((symbol) => [symbol, 0]));
  for (const value of values.values()) {
    placedCounts.set(value, (placedCounts.get(value) ?? 0) + 1);
  }

  return new Set(
    symbols.filter(
      (symbol) => (placedCounts.get(symbol) ?? 0) >= (requiredCounts.get(symbol) ?? Infinity)
    )
  );
}
