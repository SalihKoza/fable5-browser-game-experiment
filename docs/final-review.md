# Hollowmere — Final Review (V1.0)

A dark fantasy action vertical slice for the browser.
**Phaser 4 · TypeScript (strict) · Vite · Vitest** — zero runtime dependencies beyond Phaser, zero binary assets (everything placeholder-generated or synthesized).

---

## Project Overview

Hollowmere is a top-down 2D action slice: one 60×40 map with three zones
(ruins → fogbound forest → dark hollow), two enemy types, melee combat with
stamina, loot, a 12-slot inventory, guarded chests, real-time darkness where
the torch radius is a survival mechanic, a synthesized soundscape, and a
versioned save system with autosave and continue. A run ends in death — which
burns the save — or in the player closing the tab and continuing later.

The repository doubles as an educational reference: every phase has a sprint
report (`docs/phases/`), every significant decision an ADR
(`docs/decisions/`), and the architecture document (`ARCHITECTURE.md`)
explains *why* before *what*.

## Final Architecture

```
DOM UI (HUD · inventory · debug)         ← reads state, emits UI events
─────────────────────────────────────────
GAME LAYER (Phaser-aware)
  scenes/    Boot → Preload → Menu → Play ⇄ Dead   (flow FSM)
  systems/   AI → Combat → Stamina → Movement →
             Interaction → Loot → Health           (ONE ordered array)
  entities/  factories + composition (Actor = sprite + data components)
  world/     map building · lighting · fog          (presentation reads only)
  audio/     event-bus subscriber (synthesized)
  input/     ActionMap adapter (keys → semantic actions)
─────────────────────────────────────────
CORE LAYER (framework-free, lint-enforced: importing Phaser here fails CI)
  state/     GameState — 100% JSON-serializable, single source of truth
  save/      versioned file · migration chain · SaveManager choke point
  combat · movement · stamina · inventory · loot · rng · fsm · grid ·
  zones · events (typed catalogue) · EventBus · settings
─────────────────────────────────────────
PHASER 4 (loop · WebGL · arcade physics · tilemaps · loader)
BROWSER  (canvas · WebAudio · localStorage)
```

Data flows one direction per tick: input snapshot → systems mutate GameState
→ renderer/UI/audio reflect it. Systems never call each other: they share a
per-tick scratch object (`frame`) and a typed event bus, nothing else.

## Major Systems

- **Combat** — buffered swings (150 ms), geometric hitboxes (not physics
  bodies), one-hit-per-swing via hit sets, knockback, player i-frames with
  blink; all damage resolves in HealthSystem alone, queued per tick.
- **AI** — generic `core/fsm` + per-enemy brains (ghoul: patrol/chase/
  telegraphed strike; wraith: hit-and-run with retreat). AISystem computes
  *perception* (Bresenham line-of-sight + zone sight scaling) and feeds
  brains plain facts.
- **Loot & inventory** — independent-chance tables rolled on the run's seeded
  RNG; pure stack operations; DOM inventory that pauses the simulation;
  chests as map data with `worldFlags` identity.
- **Atmosphere** — per-frame canvas darkness (ambient per zone, torch,
  braziers, flicker, vignette), drifting fog, zone-scaled ambient drone plus
  synthesized sfx triggered purely by existing events.
- **Persistence** — versioned save file, tested migration machinery,
  structural validation (every corruption path = "no save"), calm-only
  autosave, mortal runs.

## Engineering Decisions (the big five)

1. **Framework at the edges** (ADR-001): Phaser owns commodity layers;
   `src/core/` is framework-free TypeScript enforced by a lint rule. Result:
   66 unit tests run headless in ~½ second, and every gameplay *rule* is
   testable without a browser.
2. **One serializable GameState** owned by PlayScene, passed as a parameter.
   The save system (Phase 5) was ~200 lines because of this Phase 0 rule.
3. **Typed event catalogue from day one.** Loot, audio, UI, autosave and
   stats all attached to events declared phases earlier — the seams were cut
   before the walls went up.
4. **Explicit system order in one array.** The most common class of game bug
   (ordering) is a code-review artifact here, not an accident of call sites.
5. **Data drives behavior**: items are validated JSON; maps are Tiled files
   from a committed generator; enemies are tuning + brains. A new enemy type
   shipped in Phase 4 with zero system changes — the claim was tested, not
   just stated.

## Trade-offs (accepted, documented)

- Canvas-2D darkness instead of Phaser's light pipeline — zero API risk,
  total control; not physically correct lighting and never needed to be.
- Auto-pickup on walk-over (doc originally said interact) — friendlier for
  small drops; E stays for deliberate interactions.
- Healing bypasses the HealthSystem queue (menu-time effects must work while
  paused); HealthSystem remains the sole writer for *damage*.
- Enemies respawn on load; loot RNG replays from seed start after a load.
- No y-sorted occlusion; loot tables in typed TS rather than JSON.

## Technical Debt (honest list)

1. ghoulBrain/wraithBrain share ~60 duplicated lines (idle/patrol/helpers).
   Extraction threshold: the third brain.
2. `WraithTuning.recoverMs` exists only to satisfy the shared tuning shape.
3. `InventoryPanel.render()` rebuilds the DOM grid on every change — wrong
   pattern above ~40 slots, fine at 12.
4. RNG draw-cursor not persisted (see ADR-002).
5. `ItemEffects` holds references bound at scene create; a future mid-run
   state *replacement* (not rebuild) would dangle them.
6. Loot tables/enemy tuning are TS, not JSON — deliberate, but it binds
   design data to a compile step.

## Performance Notes

Nothing has been optimized, because nothing needed it — measured priorities,
not guesses. Known costs: lighting redraws a 480×270 canvas with ~4 radial
gradients per frame (trivial); LoS is ~30-cell Bresenham × 7 enemies × 60 Hz
(microseconds); `getBounds()` allocates per enemy per active hitbox tick.
First things to revisit *if* scale grows: cache light gradients, pool pickup
tweens, precompute a walls boolean grid instead of `hasTileAt`.

## Lessons Learned

- Event vocabulary declared early pays compound interest — five features
  attached to `EnemyDied` without touching its emitter.
- Strict TypeScript is the cheapest migration insurance: every Phaser 4 API
  drift (five across the project) surfaced at compile time.
- Atmosphere is a mechanic: ambient darkness changed player *decisions*,
  which no shader would have.
- Placeholder-first discipline (generated art, synthesized audio) kept
  engineering unblocked for the entire project — art never gated a phase.
- Autosave policy is design, not infrastructure.

## Future Roadmap

- **Content:** third enemy (extract shared brain states first), a boss for
  the hollow, more items via a `use` discriminated union, second map.
- **Systems:** RNG cursor persistence; loot/enemy data to JSON; gamepad
  support (ActionMap was built for it); settings panel (volume slider,
  rebinding); y-sorted occlusion.
- **Production:** real art via the manifest (sprite dimensions already
  standardized); real audio via AudioDirector swap; CI workflow running the
  four checks; itch.io/Pages deploy of `dist/`.

## If I Had More Time

The single highest-value next week: **a real playtest loop** — ten strangers,
watch silently, fix the top three confusions. Engineering-wise: extract the
shared brain, persist the RNG cursor, and wire a GitHub Action so the
verification gate runs on every PR instead of every commit message promise.

## Final Playtest Checklist

Fresh profile (cleared localStorage), production build (`npm run build && npm run preview`):

- [ ] Menu shows controls; first visit offers only "press any key"
- [ ] Walk/sprint feel responsive; walls block; diagonals aren't faster
- [ ] Stamina drains/regens; sprint can't restart below threshold (bar tints red)
- [ ] Ghoul patrols, aggros on sight (not through walls), telegraphs, hits
- [ ] Taking a hit: flash + knockback + blink; no damage during blink
- [ ] Kill a ghoul: shake, loot drops, walk-over pickup with floating text
- [ ] Inventory (I/Tab) pauses the world; use herb heals; H quick-heals
- [ ] Ruin chest: E prompt appears in range, opens once, loot spawns
- [ ] Forest: fog visible, trees block movement AND sight, ambushes work
- [ ] Hollow: near-black, torch radius readable, braziers help, wraiths
      strike-and-retreat, climax chest reachable
- [ ] Audio: drone deepens per zone, sfx on swing/hurt/kill/pickup/chest, M mutes (persists after reload)
- [ ] Zone crossing autosaves (calm only); reload tab → Continue restores position/health/inventory/chests; enemies respawned
- [ ] Die: fade → stats screen → save is gone → new run works
- [ ] No console errors across all of the above

## Suggested Improvements (for the student reading this)

Trace one feature end to end — e.g. "use a healing herb": DOM button →
`UiUseItem` event → ItemEffects → `core/inventory.removeItem` +
`core/combat.applyHeal` → `InventoryChanged` → panel re-render. Every layer
of the architecture appears once in that chain, in order. Then try adding a
stamina potion: if the architecture works, you'll touch `items.json`, one
line of ItemEffects, and nothing else.

---

## Appendix: Final Self-Review Scores

| Category | Score | Note |
|---|---|---|
| Architecture | 9/10 | Layering held under change five phases straight; -1: brain duplication + tuning-shape smell |
| Maintainability | 9/10 | New content = data + one module; decisions documented where they live |
| Scalability | 7/10 | Right-sized for a slice; registry scans and DOM rebuilds would need work at 10× content |
| Code Quality | 8/10 | Strict TS, no `any`, small files; a few long scene methods |
| Documentation | 9/10 | ARCHITECTURE + 6 sprint reports + 2 ADRs + intent-comments; -1: no CONTRIBUTING/setup-troubleshooting |
| Testing | 7/10 | 66 headless tests over every core rule; adapters/scenes untested (accepted), no integration harness |
| Performance | 8/10 | Comfortable 60 fps budget by design; unmeasured because unneeded — flagged hot spots listed |
| Developer Experience | 8/10 | One-command dev/test/build, instant HMR, fail-loud data errors; -1: no CI pipeline committed |
