/**
 * Player settings — separate from the save file on purpose: settings belong
 * to the PLAYER (survive death and new runs), saves belong to the RUN.
 */
export interface Settings {
  muted: boolean;
}

const SETTINGS_KEY = 'hollowmere.settings';

export const DEFAULT_SETTINGS: Settings = { muted: false };

export function loadSettings(storage: Storage): Settings {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (raw === null) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { muted: parsed.muted === true };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(storage: Storage, settings: Settings): void {
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable — settings stay session-only */
  }
}
