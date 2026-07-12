/**
 * Tile-grid line of sight — pure Bresenham, framework-free (unit-tested).
 * Promised in Phase 2, delivered with the darkness mechanic that makes it
 * meaningful: enemies should not aggro through ruin walls.
 */

/** Is the tile at (x, y) opaque/solid? Provided by the world (walls layer). */
export type SolidFn = (tileX: number, tileY: number) => boolean;

/**
 * True if no solid tile lies strictly BETWEEN the two tiles. Endpoints are
 * not tested: actors stand in open cells, and a target hugging a wall must
 * still be visible from the open side.
 */
export function hasLineOfSight(
  solid: SolidFn,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): boolean {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;

  for (;;) {
    if (x === x1 && y === y1) return true;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
    if (x === x1 && y === y1) return true; // don't test the target cell
    if (solid(x, y)) return false;
  }
}
