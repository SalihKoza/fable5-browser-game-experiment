import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../../src/core/settings';

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

describe('settings', () => {
  it('defaults when nothing is stored', () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips', () => {
    const storage = memoryStorage();
    saveSettings(storage, { muted: true });
    expect(loadSettings(storage)).toEqual({ muted: true });
  });

  it('corrupt data falls back to defaults', () => {
    const storage = memoryStorage();
    storage.setItem('hollowmere.settings', '???');
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });
});
