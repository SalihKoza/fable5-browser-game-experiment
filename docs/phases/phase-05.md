# Phase 5 — Persistence & Polish (V1.0)

**Commit scope:** versioned save/load · autosave · continue · settings · game-feel polish · balance · v1.0
**Verified:** typecheck ✓ · lint ✓ · tests 66/66 ✓ · production build ✓

## Sprint Goal

Close the roadmap: "close the tab, come back, continue" plus the final feel
pass — ship a stable v1.0 vertical slice.

## Features Added

Versioned save system (`core/save/`): save file with `schemaVersion`, pure
migration-chain machinery (tested with synthetic versions), full structural
validation where every corruption path degrades to "no save"; `SaveManager`
choke point over injected Storage; autosave at calm checkpoint moments (zone
transitions, chest opens, kills — never while any enemy hunts); menu
**Continue/New Game** fork; **death burns the save** (ADR-002); persisted
settings (mute, M key) separate from the save; run stats (kills) shown on the
death screen; camera shake on hurt/kill; i-frame blink; HUD herb counter with
**H** quick-heal; menu controls screen; balance touches (stamina regen 22→24,
attack cost 15→12); debug overlay off by default.

## Files Created

`core/save/{saveFile,migrations,SaveManager}.ts`, `core/settings.ts`,
`tests/core/{save,settings}.test.ts`, `docs/decisions/ADR-002-save-system.md`,
`docs/final-review.md`.

## Files Modified

`GameState` (+`stats.kills` — added before the first save ever shipped, so v1
stays the first public schema), `core/input.ts` + `ActionMap` (+H, +M),
`audio/synth.ts` + `AudioDirector` (master-bus mute), `HealthSystem` (kill
stat, i-frame blink), `Hud`, `MenuScene`, `DeadScene`, `PlayScene` (save
wiring, feedback, quick-heal), `config/{game,tuning}.ts`.

## Architecture Decisions

1. **SaveManager as the single storage choke point** with injected `Storage`
   and clock — fully unit-testable, and no other file may touch the save key.
2. **Migration machinery before the first migration exists**: the chain
   runner is ~25 lines and tested with synthetic versions, so schema change
   #1 lands on proven rails rather than being written in a hotfix.
3. **Death burns the save; autosave only when calm** (ADR-002): Continue is
   for quitting, not for undoing mistakes.
4. **Settings ≠ saves**: mute belongs to the player and survives death.
5. **Quick-heal reuses `UiUseItem`** — the H key emits the same event the
   inventory button does; ItemEffects neither knows nor cares which.

## Technical Challenges

- Validation depth: deciding how paranoid `validateGameState` should be.
  Chosen line: structural + finiteness checks (NaN health is rejected), but
  no semantic clamping — a save claiming 999 herbs loads; a save missing
  `player` doesn't. Validation guards crashes, not cheating.

## Trade-offs

- RNG seed is saved without its draw cursor: a loaded run replays the loot
  stream from the start. Fix (persist a draw counter) documented as future
  work; negligible at slice scale.
- Enemies respawn on load — costs the player time, not the game fairness.
- No settings menu UI; one persisted toggle (mute) was the honest need.

## Lessons Learned

- The Phase 0 rule "GameState stays 100% JSON-serializable" made Phase 5
  mostly *validation* rather than surgery — the save system wrote itself.
- Autosave policy is game design, not infrastructure: "when" mattered more
  than "how".

## Verification Results

`tsc --noEmit` clean · `eslint .` clean · `vitest` 13 files, 66/66 passed ·
`vite build` 1.42 MB (372 kB gz).

## Next Phase

None — v1.0 ships. See `docs/final-review.md` for the full project review,
playtest checklist, and future roadmap.
