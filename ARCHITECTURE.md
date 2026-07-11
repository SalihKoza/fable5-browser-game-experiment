# HOLLOWMERE — Architecture Document (v2)

**Project type:** Browser-based dark fantasy action prototype (vertical slice)
**Stack:** Phaser 4 · TypeScript · Vite
**Status:** Approved architecture, revised for production framework. Phase 0 in progress.
**Revision note:** v1 proposed a hand-rolled engine for teaching purposes. Per direction, v2 targets *professional indie production practices*: a battle-tested framework for the commodity layers, our engineering effort spent on the game itself. The clean layering survives — it just moves up one level.

---

## 0. Design Philosophy

1. **Buy the commodity, build the product.** Rendering, the game loop, physics, asset loading, and audio are solved problems; a real studio does not rewrite them for a vertical slice. Our value-add is gameplay systems, content, and feel — that's where the code budget goes.
2. **The framework stays at the edges.** Phaser is a dependency, not the architecture. Domain logic (inventory, loot tables, stats, save schema, state machines) is framework-free TypeScript — testable headlessly, portable, and readable without knowing Phaser. This is ports-and-adapters applied to games, and it's what separates maintainable Phaser projects from 5,000-line scene files.
3. **Data drives behavior.** Enemies, items, and the map are *data* (JSON), not code. Adding a new sword never touches a system.

---

## 1. Technology Recommendation

| Choice | Decision | Why |
|---|---|---|
| Language | **TypeScript (strict)** | Game state is a large mutable object graph; strict types catch the classic bugs (undefined component, wrong shape) at compile time. Phaser ships first-class type definitions. |
| Build tool | **Vite** | Instant HMR for gameplay tuning, native TS, one-command production build. The de-facto standard for Phaser projects today (Phaser's own official templates use it). |
| Framework | **Phaser 4** (see §2) | Single runtime dependency. |
| Testing | **Vitest** | Unit tests target the framework-free `core/` layer only (inventory, loot rolls, save migration, FSMs) — they run headless with no Phaser, no browser. Feel and rendering are validated by a playtest checklist; testing pixels is low-value. |
| UI (HUD/inventory) | **DOM overlay + CSS** | Inventory grids, tooltips, and menus are lists and buttons — the DOM does layout, text, and accessibility for free and it's a common production pattern for web games. In-canvas UI is reserved for diegetic elements (floating damage numbers, world labels). |
| Lint/format | **ESLint (flat) + Prettier** | Includes an *architectural* lint rule: `src/core/**` may not import `phaser`. The layer boundary is enforced by CI, not by discipline. |

## 2. Game Engine Recommendation

**Decision: Phaser 4 (v4.2, current stable).**

Why Phaser over the field:

- **Right genre fit.** Phaser is purpose-built for exactly this: 2D action games with tilemaps, sprites, and arcade physics. Native **Tiled** map support, sprite animation, camera effects, and a Light2D pipeline for our darkness mechanic — all first-party.
- **Right physics weight.** Arcade Physics is AABB-based — fast, deterministic, and exactly what top-down melee combat needs. (Matter.js is available if we ever need rotation/joints; we won't.)
- **Production maturity.** 12+ years, thousands of shipped commercial web games, MIT license, active development, huge ecosystem of examples. Phaser 4 is the current stable line with a rewritten WebGL renderer; API continuity from Phaser 3 means the ecosystem's decade of knowledge still applies.
- **Web-native.** Ships as an npm package into a normal Vite toolchain. No editor lock-in, no multi-megabyte wasm runtime.

Alternatives considered:

- **PixiJS** — a superb renderer, but *only* a renderer: we'd hand-roll physics, tilemaps, input, audio, and scene flow. That's the v1 plan with extra steps.
- **Godot / Unity web export** — real engines, wrong deployment: 20–60 MB payloads, slow cold loads, and gameplay code trapped in an editor project rather than a readable repo.
- **Three.js / Babylon.js** — 3D triples asset and animation scope; wrong trade for a 2D slice.
- **Excalibur / Kaplay** — credible modern 2D engines, but smaller communities and less proven at production scale than Phaser; for "what would you use in a real indie production," Phaser is the defensible answer.

Perspective remains **top-down 2D with a real-time lighting/darkness pass** — dark-fantasy mood at 2D cost.

## 3. Folder Structure

Repository root = this folder.

```
├── index.html                  # Canvas mount + DOM UI root
├── package.json
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js            # incl. the core/ → phaser import ban
├── ARCHITECTURE.md
├── docs/
│   └── decisions/              # ADRs: one short file per significant decision
├── public/assets/
│   ├── manifest.json           # every loadable asset declared in one place
│   ├── sprites/                # player/, enemies/, world/, items/, fx/
│   ├── audio/                  # music/, sfx/
│   └── data/                   # items.json, enemies.json, map_hollowmere.json (Tiled)
├── src/
│   ├── main.ts                 # Composition root: Phaser.Game config + scene list
│   ├── core/                   # ★ FRAMEWORK-FREE domain logic. Never imports Phaser.
│   │   ├── state/              #   GameState type, factories, selectors
│   │   ├── inventory/          #   Inventory ops (add/remove/stack/use) as pure functions
│   │   ├── combat/             #   Damage formulas, loot roll logic
│   │   ├── save/               #   Serialization, schemaVersion, migrations
│   │   ├── events.ts           #   Typed catalogue of every game event
│   │   └── fsm.ts              #   Generic state-machine helper (used by enemy AI)
│   ├── scenes/                 # ★ Phaser adapters — thin orchestration only
│   │   ├── BootScene.ts        #   engine config, then → Preload
│   │   ├── PreloadScene.ts     #   manifest-driven loading + progress bar
│   │   ├── MenuScene.ts
│   │   ├── PlayScene.ts        #   owns GameState, runs systems in order
│   │   └── DeadScene.ts
│   ├── systems/                # gameplay systems (§5), called by PlayScene in fixed order
│   ├── entities/               # factories: createPlayer(), createGhoul() — composition
│   ├── input/                  # ActionMap: raw Phaser input → semantic actions
│   ├── world/                  # Tiled map loading, zones, spawn tables
│   ├── ui/                     # DOM HUD, inventory panel, death screen
│   └── config/                 # tuning constants, debug flags
└── tests/                      # mirrors src/core/ (unit tests for pure logic)
```

**Why:** the wall is now `core/` (framework-free) vs everything else (Phaser-aware), enforced by lint. `main.ts` is the only composition root. Scenes stay *thin* — they wire systems and entities together; the moment a scene contains business logic, it's in the wrong file. `docs/decisions/` records the *why* (this v1→v2 pivot is ADR-001).

## 4. High-Level Architecture

**Pattern: layered architecture + composition-based entities + typed event bus.**

```
┌──────────────────────────────────────────────────────┐
│ DOM UI (HUD, inventory)      ← reads state, emits UI events
├──────────────────────────────────────────────────────┤
│ GAME LAYER (Phaser-aware)                            │
│ Scenes (flow FSM) → Systems (ordered) → Entities     │
├──────────────────────────────────────────────────────┤
│ CORE LAYER (framework-free)                          │
│ GameState · inventory · combat math · save · events  │
├──────────────────────────────────────────────────────┤
│ PHASER 4   (loop · WebGL renderer · arcade physics · │
│             loader · audio · input · tilemaps)       │
├──────────────────────────────────────────────────────┤
│ BROWSER    (Canvas/WebGL · Web Audio · localStorage) │
└──────────────────────────────────────────────────────┘
```

**Entities by composition, not inheritance.** We use Phaser sprites as the *body* and attach plain-data components (`Health`, `Stamina`, `AIState`, `LootDrop`) via entity factories. No `Ghoul extends Character extends Sprite` towers — the naive OO approach collapses the moment a chest needs health. A full data-oriented ECS is rejected as overkill for ~50 entities; composition gives the benefit without the machinery.

**Typed event bus.** Systems never call each other. They emit events from a single typed catalogue (`ENEMY_DIED`, `ITEM_PICKED_UP`, `PLAYER_DAMAGED`) on a shared `Phaser.Events.EventEmitter` wrapped with TypeScript signatures. Audio, UI, and loot all react to `ENEMY_DIED` without knowing about each other, and a reader can see every possible event in one file.

## 5. Main Gameplay Systems

Phaser gives us the loop; *we* keep systems in an explicit, documented order inside `PlayScene.update()` — ordering bugs (moving after rendering, dying before damage) are the most common class of game bug, so the order is one array in one file:

1. **InputIntentSystem** — ActionMap snapshot → player intents (moveDir, wantsSprint, wantsAttack).
2. **AISystem** — enemy FSM (`idle → patrol → chase → attack → dead`) via the generic `core/fsm` helper. Perception = distance + line of sight; darkness reduces enemy sight radius (mechanics reinforce theme).
3. **MovementSystem** — sets Arcade Physics velocities from intents/AI; walk 100 %, sprint 160 %.
4. **StaminaSystem** — sprint and attacks drain stamina; delayed regen. Makes sprint a *decision* and gives combat rhythm.
5. **Collision** — delegated to Arcade Physics colliders/overlaps configured at scene setup (walls via Tiled collision layer). We write *responses*, not detection.
6. **CombatSystem** — attack = short-lived hitbox in facing direction; on overlap applies `core/combat` damage math, knockback, brief i-frames.
7. **HealthSystem** — consumes damage events, emits `ENTITY_DIED`; player death → `DeadScene`.
8. **LootSystem** — on `ENEMY_DIED`/chest opened, rolls `core/combat` loot tables, spawns pickups.
9. **PickupSystem** — overlap + interact key → `core/inventory` add, emits `ITEM_PICKED_UP`.
10. **CameraSystem** — Phaser follow-cam with lerp + small lookahead in movement direction.
11. **AnimationSystem** — maps entity state → sprite animations (Phaser anims do the frames).

Inventory is *not* a per-tick system — it's pure functions over data in `core/`, mutated by events, rendered by the DOM UI. Knowing when *not* to use a pattern is part of the architecture.

## 6. State Management

Two kinds of state, deliberately separated:

**Application flow — Phaser Scenes as the FSM:** `Boot → Preload → Menu → Play ⇄ Dead → restart`. Scenes give us `create/update/shutdown` lifecycle, and pausing Play (inventory open) is a first-class scene operation — the simulation genuinely stops, avoiding the classic wall-clock-timer-during-pause bug.

**World state — one serializable `GameState` object** owned by `PlayScene` and passed to systems as a parameter. No globals, no singletons, no `window.game`. Why: (a) it *is* the save file (§8), (b) systems become testable (build a state, run a system, assert), (c) one type definition shows everything the game knows.

Runtime-only data (Phaser sprites, textures, sounds, DOM refs) lives **outside** GameState, linked by entity ID, so GameState stays 100 % JSON-serializable. Data flows one direction per tick: `input → systems mutate GameState → Phaser objects + DOM UI reflect it`. The UI never mutates game state; it emits events (`UI_USE_ITEM`) handled by a system next tick.

## 7. Rendering Pipeline

Phaser 4's WebGL renderer does the heavy lifting; our pipeline decisions are configuration and ordering:

- **Fixed internal resolution 480×270, `pixelArt: true`, integer zoom** — a deliberate pixel-art constraint that makes placeholder art look intentional, keeps fill-rate trivial, and scales crisply to any screen via the Scale Manager (`FIT`).
- **Layering (depth):** tilemap ground → decoration → entities with **`depth = y`** (y-sorting: the standard top-down fake-depth trick, so the player walks behind ruin pillars) → FX → lighting → screen overlays.
- **Darkness/lighting — the signature pass:** Phaser's **Light2D pipeline** with strong ambient darkness; the player's torch and world braziers are point lights. Forest zones add a slow-drifting low-alpha fog texture; the dark hollow drops ambient near black so the torch radius *is* the gameplay. If Light2D fights us on tilemaps, the documented fallback is the classic render-texture trick (darkness layer with light circles erased, multiply-composited) — same look, ADR will record whichever wins.
- **Timing:** Phaser renders on rAF with variable delta; **Arcade Physics runs in fixed-step mode** (`fixedStep: true`, 60 Hz) so movement and combat stay framerate-independent — a 144 Hz monitor must not make ghouls faster. Gameplay timers use scene game-time, never wall clock.
- **Screen feedback:** camera shake on hit, flash on damage, vignette overlay — cheap, built into Phaser cameras, and disproportionately important to feel.

## 8. Save System Approach

- **Storage:** `localStorage`, one key, JSON. Right-sized: no backend, saves are a few KB. (ADR notes IndexedDB as the upgrade path past ~5 MB.)
- **What is saved:** the serializable `GameState` slice — player stats, inventory, position, world flags (chests opened, permanent kills), RNG seed. **Not** saved: anything derived or runtime (velocities, animation frames, Phaser objects) — reconstructed on load. Deciding what belongs in a save file is the real design skill here.
- **Versioning & migration:** every save embeds `schemaVersion`; loading runs an ordered chain of pure migration functions (v1→v2→v3…) living in `core/save` — fully unit-tested. Unknown version = decline politely and offer a fresh run, never crash.
- **Write policy:** autosave on zone transitions and combat end (never mid-combat — saves become tactical exploits). All writes go through one `SaveManager.save()` choke point that validates before writing; a corrupt save is worse than no save.

## 9. Input System

**Intent-based mapping — gameplay code never sees key codes.**

```
Raw (Phaser keyboard/pointer) → ActionMap → per-tick InputSnapshot
"W"/"↑"            → MOVE_UP            (held)
"Shift"            → SPRINT             (held)
"J" / left click   → ATTACK             (pressed, buffered ~150 ms)
"E"                → INTERACT           (pressed)
"I" / "Tab"        → TOGGLE_INVENTORY   (pressed)
```

- **Decoupling:** systems ask `input.isDown(Action.SPRINT)`, never `shift.isDown`. Rebinding, gamepad support, or an AI driving the player (replays, tests) become adapter swaps.
- **Snapshot per tick:** input sampled once per update into an immutable snapshot — systems reading live device state mid-tick see inconsistent input, a classic bug designed out.
- **Edge detection:** *held* vs *pressed-this-tick* — attack fires once per press, movement per hold.
- **Attack buffering (~150 ms):** a press just before the previous swing ends still fires. Invisible in diffs, enormous in feel.
- Hygiene: capture Tab (else it leaves the page), clear input on window blur (no stuck sprint after alt-tab).

## 10. Asset Organization

- **Manifest-driven loading:** `public/assets/manifest.json` declares every asset (ID, path, type). `PreloadScene` feeds it to Phaser's Loader with a progress bar. One place to audit what ships; a missing asset fails loudly at boot, not as an invisible sprite at minute 20.
- **Data as assets:** `items.json`, `enemies.json` load the same way and are validated against TS types at load time (fail fast on typos). New enemy = new JSON entry, zero system changes.
- **Map authoring: Tiled** (industry-standard free editor, first-party Phaser support). Layers: ground, decoration, collision; object layer for spawns, chests, lights. One ~60×60-tile map, three readable zones: **ruins** (open, chests, patrols), **forest** (fog, ambushes), **dark hollow** (near-black, torch required, loot climax).
- **Placeholder-first pipeline:** every sprite starts as a labeled colored rectangle; gameplay is proven before art exists, so art never blocks engineering. Real art later from CC0 packs (itch.io dark-fantasy tilesets) — which is why sprite dimensions and naming (`enemy_ghoul_walk_01`, sheet + frame JSON) are standardized now.

## 11. Development Roadmap

Vertical phases — each ends *playable*, never "engine done, game 0 %". Exit criteria are the definition of done; each phase adds unit tests for its `core/` logic and an ADR for any decision made.

| Phase | Scope | Exit criterion |
|---|---|---|
| **0. Skeleton** | Vite+TS+Phaser scaffold, lint boundary rule, Boot→Preload→Menu→Play scene flow, debug overlay, first core/ module + test, CI-able scripts | Builds clean; a placeholder square renders in Play; fps overlay live |
| **1. Movement** | ActionMap input, player entity, Tiled map load + collision, camera follow, stamina sprint | Walk/sprint the map, blocked by walls, stamina bar reacts; feels responsive |
| **2. Combat** | Attack hitboxes, ghoul with full AI FSM, health, knockback, i-frames, death → DeadScene → restart | Can kill and be killed; restart works; combat feels fair |
| **3. Loot & inventory** | Loot tables, pickups, `core/inventory` + DOM UI, chests, healing herb | Kill → loot → open inventory → use potion → survive |
| **4. World & atmosphere** | Full 3-zone map, Light2D darkness, fog, second enemy, ambient audio + sfx | The slice *feels* dark fantasy; each zone plays differently |
| **5. Persistence & polish** | Versioned save/load, autosave, shake/flash, balance pass, playtest checklist | Close tab, return, continue; a stranger plays unassisted for 5 min |

**Accepted risks:** Phaser 4 is newer than the 3.x line (mitigation: API continuity, strict types surface breaks at compile time, and the 3.x ecosystem knowledge still applies); Light2D-on-tilemap has a documented fallback; no multiplayer/backend is ever intended for this slice.
