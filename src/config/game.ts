/**
 * Central tuning constants. Gameplay code imports from here instead of
 * scattering magic numbers — a balance pass touches one file.
 */
export const GAME_CONFIG = {
  /** Fixed internal resolution (ARCHITECTURE.md §7). Scaled up crisply by Phaser. */
  width: 480,
  height: 270,
  /** Fixed simulation rate for Arcade Physics (framerate independence). */
  physicsFps: 60,
  /** Show the fps/debug overlay. Flip off for "release" builds. */
  debugOverlay: true,
  /** Draw arcade physics bodies — noisy; enable only when debugging collision. */
  debugPhysics: false,
} as const;

/** Scene keys as constants — no stringly-typed scene transitions. */
export const SceneKey = {
  Boot: 'Boot',
  Preload: 'Preload',
  Menu: 'Menu',
  Play: 'Play',
  Dead: 'Dead',
} as const;
export type SceneKey = (typeof SceneKey)[keyof typeof SceneKey];
