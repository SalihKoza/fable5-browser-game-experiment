# Phase 4 — World & Atmosphere

**Commit scope:** three-zone map · darkness/torch lighting · fog · line-of-sight AI · wraith enemy · procedural audio
**Verified:** typecheck ✓ · lint ✓ · tests 49/49 ✓ · production build ✓

## Sprint Goal

Make the slice *feel* dark fantasy, with each zone playing differently
(roadmap exit criterion). Atmosphere here is not decoration: darkness changes
enemy perception, zones change the soundtrack, and the torch radius becomes a
survival mechanic in the hollow.

## Features Added

60×40 map with three authored zones — **ruins** (open stone, patrols, a
ruined building), **forest** (tree clusters, carved paths, rolling fog,
reduced enemy sight), **dark hollow** (near-black, wraiths, climax chest);
per-frame canvas darkness pass with eased zone ambience, player torch,
three braziers (map data), flicker and vignette; drifting screen-space fog in
the forest; AI perception upgrade — tile line-of-sight (walls block aggro)
plus zone sight-scaling (ghouls see 55–75% as far in dark zones; wraiths see
in the dark); the **wraith** — fast, fragile, hit-and-run (chase → 200 ms
windup → strike → fading retreat), with its own loot table; fully synthesized
WebAudio soundscape — zone-scaled ambient drone plus sfx for swing, hurt,
kill, pickup, chest and death, all triggered purely by existing bus events.

## Files Created

`core/zones.ts`, `core/grid.ts` (both pure + tested),
`world/LightingOverlay.ts`, `world/FogLayer.ts`, `systems/wraithBrain.ts`,
`entities/Wraith.ts`, `audio/synth.ts`, `audio/AudioDirector.ts`,
`tests/core/{zones,grid}.test.ts`.

## Files Modified

Map generator (full rewrite: 60×40, 8-tile tileset, zone rects, lights,
carved forest paths, spawn-cell carving) + regenerated assets;
`createWorld.ts` (zones/lights/wraiths/`solidAt`/fail-loud zone validation);
`AISystem.ts` (perception: LoS + sight scale, handed to brains as plain
facts); `ghoulBrain.ts` (`canAggro` = distance×scale + LoS; chase persists by
leash); `Actor.ts` (BrainContext +`canSeePlayer`/`aggroScale`, +wraith kind);
`CombatSystem.ts` (+PlayerAttacked); `LootSystem.ts` (table per enemy type);
`events/tuning/lootTables/assets`; `PlayScene.ts` (zone tracking, atmosphere
wiring). `GameState` unchanged — atmosphere is presentation + perception.

## Architecture Decisions

1. **Darkness = canvas overlay, not Phaser's light pipeline** — the ADR-001
   fallback promoted to primary: fill ambient alpha, punch radial gradients
   at lights (`destination-out`), vignette in the same pass. Zero Phaser 4
   API risk, total control, trivial cost at 480×270.
2. **AISystem computes perception; brains receive facts.** `canSeePlayer` and
   `aggroScale` arrive via BrainContext — brains stay world-agnostic and the
   LoS math lives in pure, tested `core/grid`.
3. **Zones are map data** (Tiled rects, validated fail-loud) feeding one
   tuning table: ambient, sight scale, fog, drone gain. The zone IS the
   difficulty dial, and Phase 5's save never needs to know about it.
4. **Audio is an event-bus subscriber** — gameplay emits the events it
   already emitted; `AudioDirector` scores them. Same architectural seat as
   the UI: react, never mutate. Sounds are synthesized (placeholder-first
   applied to audio): zero asset files; swapping in real audio later touches
   only the director.
5. **Second enemy proved the composition claim:** wraith = new brain + new
   tuning + one loot-table entry. Zero changes to any system.

## Technical Challenges

- Balancing LoS fairness: testing intermediate cells only (endpoints skipped)
  keeps wall-hugging players visible and prevents "enemy sees me through the
  wall I'm touching" complaints — encoded as a unit test, not tribal memory.
- WebAudio autoplay policy: the context resumes lazily on every play call; by
  PlayScene the user has always pressed a key (menu), so the gesture
  requirement is already satisfied.

## Trade-offs

- **No y-sorted occlusion** for trees/walls (player never renders behind
  them). With tile-based solids and this camera the artifact is minor;
  deferred as polish, not silently forgotten.
- Torch flicker uses `Math.random` — deliberate: presentation-only
  randomness stays off the seeded simulation stream.
- Fog is screen-space (three drifting blobs), not simulated world mist —
  right cost for a vertical slice; reads convincingly at 480×270.
- LoS is recomputed per enemy per tick (7 enemies × ~30-cell Bresenham —
  microseconds). Caching would be premature.

## Lessons Learned

- Mechanics > shaders for atmosphere: ambient 0.88 in the hollow does more
  for dread than any post-processing could, because it changes *decisions*
  (hug the braziers, or risk the dark with wraiths you can't see).
- The BrainContext seam earned its keep: adding perception didn't touch a
  single brain state — only the facts fed into them.

## Verification Results

`tsc --noEmit` clean · `eslint .` clean · `vitest` 11 files, 49/49 passed ·
`vite build` 1.41 MB (370 kB gz) · map validation: all 14 spawn objects on
clear tiles, zones tile the full map width.

## Next Phase

Phase 5 — Persistence & polish: versioned save/load (`core/save` migrations,
`SaveManager` choke point), autosave on zone transitions & combat end,
continue-from-menu, hit feedback polish (shake/flash), balance pass,
playtest checklist. `worldFlags` (chests) and the serializable GameState have
been save-ready since Phase 3.
