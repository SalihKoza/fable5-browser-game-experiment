import { ZONE_TUNING } from '../config/tuning';
import { hasLineOfSight, type SolidFn } from '../core/grid';
import { zoneAt, type Zone } from '../core/zones';
import type { GameSystem, SystemContext } from './System';

/** World facts the AI perceives through — provided by createWorld. */
export interface AiWorldDeps {
  solidAt: SolidFn;
  tileSize: number;
  zones: readonly Zone[];
}

/**
 * Runs every enemy brain once per tick (§5). The system computes PERCEPTION
 * (line of sight, zone-scaled sight range) and hands brains plain facts —
 * brains decide behavior, they never query the world directly. A new enemy
 * type is a new brain factory, not a change here.
 */
export class AISystem implements GameSystem {
  readonly name = 'ai';

  constructor(private readonly world: AiWorldDeps) {}

  update(ctx: SystemContext): void {
    for (const enemy of ctx.actors.enemies()) {
      if (!enemy.brain) continue;
      // While knocked back, physics owns the body — the brain doesn't fight it.
      if (enemy.hurt.knockbackRemainingMs > 0) continue;

      enemy.brain.update({
        self: enemy,
        player: ctx.player,
        dtMs: ctx.dtMs,
        bus: ctx.bus,
        rng: ctx.rng,
        canSeePlayer: this.canSee(enemy.sprite, ctx.player.sprite),
        aggroScale: this.sightScale(enemy),
      });
    }
  }

  private canSee(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
    const ts = this.world.tileSize;
    return hasLineOfSight(
      this.world.solidAt,
      Math.floor(a.x / ts),
      Math.floor(a.y / ts),
      Math.floor(b.x / ts),
      Math.floor(b.y / ts),
    );
  }

  /** Darkness dulls most eyes; wraiths ARE the dark (scale 1 everywhere). */
  private sightScale(enemy: { kind: string; sprite: { x: number; y: number } }): number {
    if (enemy.kind === 'wraith') return 1;
    const zone = zoneAt(this.world.zones, enemy.sprite.x, enemy.sprite.y);
    return zone ? ZONE_TUNING[zone].sightScale : 1;
  }
}
