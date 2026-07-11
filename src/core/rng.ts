/**
 * Seeded RNG (mulberry32) — framework-free, unit-tested.
 *
 * Why not Math.random: a run's randomness must be REPRODUCIBLE. The seed
 * lives in GameState (§6/§8), so a loaded save re-rolls the same loot and a
 * bug report's seed replays the same run. Mulberry32 is the standard tiny
 * (non-cryptographic) PRNG: one 32-bit word of state, excellent distribution
 * for game use.
 */
export type Rng = () => number;

/** Returns a function yielding floats in [0, 1), deterministic per seed. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0; // force uint32; fractional/negative seeds still work
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] inclusive — the shape loot quantities need. */
export function rollInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}
