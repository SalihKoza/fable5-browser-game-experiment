# Phase 2 — Combat

**Commit scope:** attack hitboxes · ghoul AI FSM · health/knockback/i-frames · death → DeadScene → restart
**Verified:** typecheck ✓ · lint ✓ · tests 27/27 ✓ · production build ✓

## Sprint Goal

The complete kill-and-be-killed loop (roadmap exit criterion: "can kill and be
killed; restart works; combat feels fair"). Combat consumes what Phase 1
built — facing, collision, stamina — and produces what Phase 3 needs: dead
enemies to drop loot.

## Features Added

Player melee swing (buffered ~150 ms, 420 ms cooldown, stamina cost, directional
hitbox with slash FX); ghoul enemy with a five-state FSM
(idle → patrol → chase → windup → recover) including telegraphed strikes,
aggro/leash radii and home-anchored patrol; health with knockback, white
hit-flash, player i-frames (600 ms); enemy death fade; player death →
camera fade → DeadScene (run time shown) → clean restart; health bar in the HUD;
three ghoul spawn points as Tiled map data.

## Files Created

`src/core/EventBus.ts`, `src/core/fsm.ts`, `src/core/combat.ts` (all pure +
tested), `src/entities/Actor.ts` (Actor record + ActorRegistry),
`src/entities/Ghoul.ts`, `src/systems/ghoulBrain.ts`, `src/systems/AISystem.ts`,
`src/systems/CombatSystem.ts`, `src/systems/HealthSystem.ts`,
`src/scenes/DeadScene.ts`, `tests/core/{eventBus,fsm,combat}.test.ts`.

## Files Modified

`core/events.ts` (+EntityDamaged/PlayerDied, GameBus type), `core/input.ts` +
`input/ActionMap.ts` (+Attack, edge detection, pointer support),
`config/{tuning,game,assets}.ts`, `entities/Player.ts` (returns an Actor),
`systems/System.ts` (ctx gains bus/actors/player; frame gains staminaSpend),
`systems/{MovementSystem,StaminaSystem}.ts`, `scenes/PlayScene.ts`,
`ui/Hud.ts` (+health bar), `main.ts` (+DeadScene),
`tools/generate_placeholder_assets.py` + regenerated map (+ghoul spawns).
`GameState` unchanged — no schema pressure.

## Architecture Decisions

1. **Hitboxes are geometry, not physics bodies.** A swing is
   `{rect, lifeMs, hitIds}` checked against enemy bounds. Attacks need overlap
   *queries*, not collision *response*; the per-swing `hitIds` set gives
   one-hit-per-target for free.
2. **One health writer.** Damage is requested via `EntityDamaged` events;
   only HealthSystem mutates health, applies knockback/i-frames, and emits
   `EnemyDied`/`PlayerDied`. Queued and resolved once per tick, in order.
3. **System order (PlayScene):** AI → Combat → Stamina → Movement → Health.
   Requesters first, resource owners second, resolution last. Combat requests
   its stamina cost via `frame.staminaSpend` — same scratch-object pattern as
   `frame.sprinting`; still zero system-to-system calls.
4. **Brains behind an interface.** AISystem runs any `Brain`; all
   ghoul-specific behavior lives in `ghoulBrain.ts` on the generic `core/fsm`.
   A second enemy type = new brain + tuning, no system changes.
5. **Enemy health on the Actor (runtime); player health mirrored into
   GameState** — the established single-owner/mirror pattern.

## Technical Challenges

- **Phaser 4 API drift, caught by strict TS:** `setTintFill(color)` no longer
  exists — fill-flash is now `setTint(color)` + `setTintMode(TintModes.FILL)`,
  and the mode must be reset afterwards. This is exactly the class of bug the
  "strict types surface API drift" mitigation in ADR-001 predicted.
- **Scene-restart hygiene:** event buses + subscriptions are rebuilt per run;
  `bus.clear()` on scene shutdown prevents stale handlers from a dead run
  firing twice — the classic restart bug, designed out.

## Trade-offs

- Aggro is **distance-only**; line-of-sight raycasts are postponed to Phase 4
  where darkness makes them meaningful.
- Enemies get hitstun but **no i-frames** (multi-hit prevention comes from the
  swing's hitIds); only the player gets i-frames — a fairness asymmetry, chosen
  deliberately.
- Patrol wandering uses `Math.random`; the seeded RNG waits until Phase 3,
  where loot rolls actually need reproducibility.
- Attack aims along the movement facing (8 directions), not the mouse — keeps
  keyboard and mouse parity; revisit only if playtests want mouse aiming.

## Lessons Learned

- The damage-as-event design paid off immediately: ghoul strikes and player
  swings share one resolution path, and Phase 3's "on-death loot" is just one
  more `EnemyDied` subscriber.
- Windup telegraphs (pause + tint) are non-negotiable for melee fairness even
  in a placeholder-art prototype — combat reads as "my fault" instead of random.

## Verification Results

`tsc --noEmit` clean · `eslint .` clean (incl. core/→Phaser ban) ·
`vitest` 6 files, 27/27 passed · `vite build` 1.39 MB (364 kB gz).

## Next Phase

Phase 3 — Loot & inventory: loot tables + seeded RNG, pickups, `core/inventory`
pure ops, DOM inventory UI, chests, healing herb. (`EnemyDied` subscriber +
`ItemPickedUp`/`UiUseItem` events already reserved in the catalogue.)
