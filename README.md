# Hollowmere

A dark fantasy action vertical slice for the browser. **Phaser 4 · TypeScript · Vite.**

Read [ARCHITECTURE.md](./ARCHITECTURE.md) first — every structural decision is explained there; significant choices get an ADR in [docs/decisions/](./docs/decisions/).

## Run it

```bash
npm install
npm run dev        # dev server with hot reload
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | typecheck + production build to `dist/` |
| `npm test` | unit tests (framework-free `src/core/` only) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, incl. the core/→Phaser import ban |

## Status

Phase 0 (skeleton) of the [roadmap](./ARCHITECTURE.md#11-development-roadmap): scene flow Boot → Preload → Menu → Play, manifest-driven loader, GameState + first tests, debug overlay.
