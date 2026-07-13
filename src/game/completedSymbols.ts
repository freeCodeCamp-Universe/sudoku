import type { Values, SymbolValue } from '@/engine/types';

export function findCompletedSymbols(
  values: Values,
  symbols: SymbolValue[],
  totalCells: number
): Set<SymbolValue> {
  const requiredCount = Math.ceil(totalCells / symbols.length);
  const counts = new Map<SymbolValue, number>(symbols.map((symbol) => [symbol, 0]));

  for (const value of values.values()) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return new Set(symbols.filter((symbol) => (counts.get(symbol) ?? 0) >= requiredCount));
}
