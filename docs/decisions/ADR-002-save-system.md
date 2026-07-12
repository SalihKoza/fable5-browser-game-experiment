# ADR-002: Save system — localStorage, mortal runs, respawning enemies

**Status:** Accepted · **Date:** 2026-07-12 (v1.0)

## Context

Phase 5 ships persistence. Three design questions needed answers: where saves
live, what death means for a save, and how much of the world a save captures.

## Decisions

1. **localStorage, one key, versioned JSON.** Saves are a few KB; no backend
   exists or is planned. The file embeds `schemaVersion`; loading runs a pure
   migration chain (`core/save/migrations.ts`) and full structural validation.
   Every failure mode — corrupt JSON, wrong shape, unreachable version,
   storage disabled — degrades to "no save", never a crash.
2. **Death burns the save.** Runs are mortal: dying clears the checkpoint and
   the DeadScene says so. Continue exists for *quitting*, not for undoing
   mistakes. Autosave reinforces this: it fires at checkpoint moments (zone
   transitions, chest opens, kills) but only when no enemy is mid-hunt.
3. **Saves capture the serializable GameState only.** Enemies respawn on
   load; opened chests stay open (`worldFlags`); player position, health,
   stamina, inventory, kills and play time persist. This is the
   runtime-vs-state split (§6) doing its job: a save is a GameState, nothing
   more.

## Consequences

- (+) The Phase 0 decision to keep GameState 100% JSON-serializable made the
  save system ~200 lines, mostly validation.
- (+) Settings (mute) are stored separately — they belong to the player, not
  the run, and survive death.
- (−) The RNG seed is saved but not its draw cursor: a loaded run replays the
  loot stream from the start. Honest fix (persist a draw counter) is listed
  as future work; impact in a slice this size is negligible.
- (−) Respawning enemies means a quit-reload refills the map. Acceptable —
  it costs the player time, not the game its fairness.
