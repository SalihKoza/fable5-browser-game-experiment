# ADR-001: Phaser 4 over a custom engine

**Status:** Accepted · **Date:** 2026-07-11

## Context

Architecture v1 proposed a hand-rolled Canvas 2D engine to maximize educational
transparency. Project direction changed: evaluate a *professional indie
production* workflow, not an engine-building exercise.

## Decision

Use **Phaser 4** (v4.2, current stable) as the single runtime dependency.
Preserve the clean layering by moving the wall up one level: `src/core/` is
framework-free domain logic (enforced by ESLint), Phaser lives in
scenes/systems/entities adapters.

## Consequences

- (+) Rendering, loop, arcade physics, Tiled tilemaps, loader, audio, and
  Light2D come battle-tested; code budget goes to gameplay and content.
- (+) Domain logic stays headlessly unit-testable (Vitest, no browser).
- (−) Bundle includes Phaser (~1.2 MB gz) — acceptable for a game; the Vite
  chunk-size warning limit was raised consciously.
- (−) Phaser 4 is newer than the 3.x line; strict TypeScript surfaces any API
  drift at compile time, and 3.x ecosystem knowledge largely applies.
