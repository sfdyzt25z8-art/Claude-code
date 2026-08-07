/**
 * Deterministic seeded PRNG (mulberry32). Used for track generation and
 * anything that needs reproducible randomness (e.g. daily challenge seeds).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToSeed(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRng(seedInput: number | string): () => number {
  const seed = typeof seedInput === 'string' ? hashStringToSeed(seedInput) : seedInput;
  return mulberry32(seed);
}

/** Seed for "today" — used for daily missions / daily challenge tracks. */
export function dailySeed(date: Date = new Date()): number {
  const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
  return hashStringToSeed(key);
}
