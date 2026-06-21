// A deterministic, seedable pseudo-random generator. Puzzle generation must be
// pure with respect to its inputs: React may re-run the memo that generates a
// puzzle (StrictMode double-invokes it in dev, and is free to drop the cache),
// and an unseeded Math.random() would yield a different puzzle each time. That
// desyncs the rendered givens from the validation solution and spuriously flags
// untouched cells. Seeding from stable inputs keeps every recompute identical.

const MODULUS = 0x7fffffff;

export function createSeededRng(seed: number): () => number {
  let state = Math.abs(Math.trunc(seed)) % MODULUS;
  if (state === 0) {
    state = 1;
  }

  return () => {
    state = (state * 1103515245 + 12345) & MODULUS;
    return state / MODULUS;
  };
}

// FNV-1a hash over the stringified parts, returned as an unsigned 32-bit integer.
export function hashSeed(...parts: Array<string | number>): number {
  let hash = 2166136261;

  for (const char of parts.join('|')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
