# Phase 3 — Loot & Inventory

**Commit scope:** seeded RNG · loot tables · pickups · chests · inventory (data + DOM UI) · healing herb
**Verified:** typecheck ✓ · lint ✓ · tests 40/40 ✓ · production build ✓

## Sprint Goal

Close the survival loop (roadmap exit criterion: "kill → loot → open inventory
→ use potion → survive") and make the world reward exploration with guarded
chests.

## Features Added

Ghouls drop loot where they die (independent-chance tables); drops scatter,
bob, and auto-collect on walk-over with floating "+1 Healing Herb" feedback;
two chests placed as map data (one guarded inside the ruin) with an "E" prompt,
open-state recorded in `worldFlags`; a 12-slot stacking inventory rendered as a
DOM panel (I/Tab) that pauses the simulation; healing herbs usable from the
panel (won't waste at full HP, won't resurrect); all run randomness now flows
from one seeded stream (`GameState.rngSeed`).

## Files Created

`core/rng.ts` (mulberry32 + rollInt), `core/inventory.ts` (pure stack ops),
`core/loot.ts` (table rolls), `data/itemCatalog.ts` (items.json validation),
`config/lootTables.ts`, `entities/Chest.ts`, `systems/LootSystem.ts`,
`systems/InteractionSystem.ts`, `systems/ItemEffects.ts`,
`ui/InventoryPanel.ts`, `public/assets/data/items.json`,
`tests/core/{rng,inventory,loot}.test.ts`.

## Files Modified

`core/input.ts` + `input/ActionMap.ts` (+Interact, +ToggleInventory, Tab
capture), `core/events.ts` (+ChestOpened/InventoryChanged; EnemyDied carries
death position), `core/combat.ts` (+applyHeal), `entities/Actor.ts` +
`systems/AISystem.ts` + `systems/ghoulBrain.ts` (brains draw from the seeded
RNG), `systems/System.ts` (ctx gains `rng`), `systems/HealthSystem.ts`,
`config/{tuning,assets}.ts`, `world/createWorld.ts` (+chestSpawns),
`scenes/PlayScene.ts` (system order, inventory pause, catalog),
`manifest.json`, map generator + regenerated map. `GameState` unchanged.

## Architecture Decisions

1. **All randomness on one seeded stream.** `createRng(state.rngSeed)` feeds
   loot rolls AND ai patrol via `ctx.rng` — a run is reproducible from its
   GameState alone (pays off the Phase 2 `Math.random` debt). Event handlers
   only *queue* loot sources; rolls happen inside `update()` where the seeded
   stream is available.
2. **Items are data, tables are typed config.** `items.json` exercises the
   validated data-asset pipeline (§10, fail-loud `parseItemCatalog`); loot
   tables stay in TS where they get compile-time checking. Promoting tables to
   JSON is planned work, not accidental debt.
3. **LootSystem owns spawn AND collect** (the doc sketched two systems): both
   halves share the pickup collection; splitting would create a third module
   whose only job is holding shared state.
4. **Menu-time effects bypass the tick.** `ItemEffects` handles `UiUseItem`
   immediately because potions must work while the simulation is paused.
   Documented deviation: HealthSystem stays the sole writer for *damage*
   (ordering/i-frames/death); healing math still lives in `core/combat`.
5. **Pause = physics paused + systems skipped + game-time frozen**, while
   input sampling keeps running so the close key works. No wall-clock leakage.
6. **Chest identity = Tiled object id** → `worldFlags["chest:<id>"]` — the
   Phase 5 save system persists opened chests with zero new code here.

## Technical Challenges

- Two more Phaser 4 typing drifts caught at compile time: `fillPoints` now
  requires real `Vector2` instances (replaced with two `fillTriangle` calls),
  and an `as const` tuning literal needed explicit widening to `number`.
- The UI-mutation temptation: the inventory panel *renders* buttons but only
  emits `UiUseItem`; state changes stay in game code (§6). `InventoryChanged`
  closes the loop back to the UI.

## Trade-offs

- **Auto-pickup on walk-over** instead of the doc's interact-to-pickup:
  friendlier for small drops; E stays reserved for deliberate interactions
  (chests). Documented deviation from §5's original sketch.
- Inventory has **no drag/drop, sorting, or item dropping** — a vertical slice
  needs "hold and use", not an inventory management minigame.
- `ItemEffects` currently knows only `heal`; effect *kinds* (buffs, keys)
  would become a discriminated union on `ItemDef.use` when a second kind
  exists — not before.

## Lessons Learned

- Reserving `ItemPickedUp`/`UiUseItem` in the Phase 0 event catalogue meant
  Phase 3 wired into existing seams instead of cutting new ones — declaring
  event vocabulary early is cheap and pays compound interest.
- Queue-in-handler / roll-in-update is a useful general pattern: event
  handlers stay trivial, and everything that needs per-tick resources (rng,
  ctx) happens in the system's own update.

## Verification Results

`tsc --noEmit` clean · `eslint .` clean · `vitest` 9 files, 40/40 passed ·
`vite build` 1.40 MB (367 kB gz).

## Next Phase

Phase 4 — World & atmosphere: full three-zone map, Light2D darkness + torch,
fog, a second enemy type (new brain + tuning, zero system changes — by
design), ambient audio + sfx hooks on existing events.
