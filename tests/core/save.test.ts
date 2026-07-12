import { describe, expect, it } from 'vitest';
import { migrateState, type Migration } from '../../src/core/save/migrations';
import { SaveManager } from '../../src/core/save/SaveManager';
import { validateGameState } from '../../src/core/save/saveFile';
import { createNewGameState } from '../../src/core/state/GameState';

/** Minimal in-memory Storage stub — what injection buys us. */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

describe('SaveManager round trip', () => {
  it('save → load returns an identical GameState', () => {
    const sm = new SaveManager(memoryStorage(), () => 12345);
    const state = createNewGameState(42);
    state.player.inventory = [{ itemId: 'healing_herb', quantity: 3 }];
    state.worldFlags['chest:9'] = true;
    state.stats.kills = 4;

    expect(sm.save(state)).toBe(true);
    expect(sm.load()).toEqual(state);
    expect(sm.hasSave()).toBe(true);
  });

  it('clear() removes the save', () => {
    const sm = new SaveManager(memoryStorage());
    sm.save(createNewGameState(1));
    sm.clear();
    expect(sm.load()).toBeNull();
    expect(sm.hasSave()).toBe(false);
  });

  it('corrupt JSON degrades to "no save", never a crash', () => {
    const storage = memoryStorage();
    storage.setItem('hollowmere.save', '{not json');
    expect(new SaveManager(storage).load()).toBeNull();
  });

  it('valid JSON with the wrong shape degrades to "no save"', () => {
    const storage = memoryStorage();
    storage.setItem('hollowmere.save', JSON.stringify({ hello: 'world' }));
    expect(new SaveManager(storage).load()).toBeNull();
  });

  it('a save from a FUTURE schema version is refused', () => {
    const storage = memoryStorage();
    const sm = new SaveManager(storage);
    sm.save(createNewGameState(1));
    const raw = JSON.parse(storage.getItem('hollowmere.save')!) as { schemaVersion: number };
    raw.schemaVersion = 999;
    storage.setItem('hollowmere.save', JSON.stringify(raw));
    expect(sm.load()).toBeNull();
  });
});

describe('validateGameState', () => {
  it('accepts a freshly created state', () => {
    expect(validateGameState(createNewGameState(7))).not.toBeNull();
  });

  it.each([
    ['missing player', { ...createNewGameState(1), player: undefined }],
    ['NaN health', (() => { const s = createNewGameState(1); s.player.health = NaN; return s; })()],
    ['bad inventory slot', (() => { const s = createNewGameState(1); s.player.inventory = [{ itemId: 'x', quantity: 0 }]; return s; })()],
    ['missing stats', { ...createNewGameState(1), stats: undefined }],
  ])('rejects %s', (_label, broken) => {
    expect(validateGameState(broken)).toBeNull();
  });
});

describe('migrateState (chain machinery, synthetic versions)', () => {
  const v0to1: Migration = (s) => ({ ...s, addedInV1: true });
  const v1to2: Migration = (s) => ({ ...s, addedInV2: true });

  it('applies the full chain in order and stamps the final version', () => {
    const out = migrateState({ old: 1 }, 0, 2, { 0: v0to1, 1: v1to2 });
    expect(out).toEqual({ old: 1, addedInV1: true, addedInV2: true, schemaVersion: 2 });
  });

  it('a gap in the chain refuses rather than guessing', () => {
    expect(migrateState({}, 0, 2, { 1: v1to2 })).toBeNull();
  });

  it('same-version input passes through untouched', () => {
    expect(migrateState({ a: 1 }, 2, 2, {})).toEqual({ a: 1 });
  });

  it('future versions are refused', () => {
    expect(migrateState({}, 3, 2, {})).toBeNull();
  });
});
