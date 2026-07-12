import type { WraithTuning } from '../config/tuning';
import { GameEvent } from '../core/events';
import { Fsm } from '../core/fsm';
import type { Vec2Like } from '../core/state/GameState';
import type { Brain, BrainContext } from '../entities/Actor';

/**
 * Wraith AI: hit-and-run — idle → patrol → chase → windup → strike → RETREAT
 * → chase. The retreat is what differentiates it from the ghoul: wraiths
 * never stand and trade, so the player must chase or reposition.
 *
 * Second enemy = new brain + tuning, zero system changes (the Phase 2 claim,
 * now proven). Wraiths ignore the darkness sight penalty (ctx.aggroScale is
 * fed as 1 by AISystem for wraiths — they ARE the dark) but walls still
 * block their sight: gameplay clarity beats ghost physics.
 */
export function createWraithBrain(cfg: WraithTuning): Brain {
  const fsm = new Fsm<BrainContext>(
    {
      idle: {
        onEnter: (ctx) => {
          ai(ctx).stateTimerMs = cfg.idlePauseMs;
          ctx.self.sprite.setVelocity(0, 0);
        },
        update: (ctx) => {
          if (canAggro(ctx, cfg)) return 'chase';
          ai(ctx).stateTimerMs -= ctx.dtMs;
          return ai(ctx).stateTimerMs <= 0 ? 'patrol' : undefined;
        },
      },

      patrol: {
        onEnter: (ctx) => {
          const { home } = ai(ctx);
          const angle = ctx.rng() * Math.PI * 2;
          const r = cfg.patrolRadius * (0.4 + ctx.rng() * 0.6);
          ai(ctx).patrolTarget = {
            x: home.x + Math.cos(angle) * r,
            y: home.y + Math.sin(angle) * r,
          };
        },
        update: (ctx) => {
          if (canAggro(ctx, cfg)) return 'chase';
          const target = ai(ctx).patrolTarget;
          if (!target || moveToward(ctx, target, cfg.patrolSpeed) < 4) return 'idle';
          return undefined;
        },
      },

      chase: {
        update: (ctx) => {
          const d = playerDist(ctx);
          if (d > cfg.leashRadius) return 'idle';
          if (d <= cfg.attackRange) return 'windup';
          moveToward(ctx, ctx.player.sprite, cfg.chaseSpeed);
          return undefined;
        },
      },

      // Short telegraph — wraiths are fast but fragile; the counterplay is
      // hitting them during the retreat, not dodging a long windup.
      windup: {
        onEnter: (ctx) => {
          ai(ctx).stateTimerMs = cfg.windupMs;
          ctx.self.sprite.setVelocity(0, 0);
          ctx.self.sprite.setAlpha(1); // solidifies to strike
        },
        update: (ctx) => {
          ai(ctx).stateTimerMs -= ctx.dtMs;
          if (ai(ctx).stateTimerMs > 0) return undefined;
          if (playerDist(ctx) <= cfg.strikeRange) {
            ctx.bus.emit(GameEvent.EntityDamaged, {
              targetId: ctx.player.id,
              amount: cfg.damage,
              sourceX: ctx.self.sprite.x,
              sourceY: ctx.self.sprite.y,
              knockbackForce: cfg.knockbackForce,
            });
          }
          return 'retreat';
        },
      },

      retreat: {
        onEnter: (ctx) => {
          ai(ctx).stateTimerMs = cfg.retreatMs;
          ctx.self.sprite.setAlpha(0.65); // fades while slipping away
        },
        update: (ctx) => {
          ai(ctx).stateTimerMs -= ctx.dtMs;
          // Flee directly away from the player.
          const s = ctx.self.sprite;
          const dx = s.x - ctx.player.sprite.x;
          const dy = s.y - ctx.player.sprite.y;
          const len = Math.hypot(dx, dy) || 1;
          s.setVelocity((dx / len) * cfg.retreatSpeed, (dy / len) * cfg.retreatSpeed);
          if (ai(ctx).stateTimerMs > 0) return undefined;
          s.setAlpha(0.85);
          return 'chase';
        },
      },
    },
    'idle',
  );

  return {
    get state() {
      return fsm.current;
    },
    update: (ctx) => fsm.update(ctx),
  };
}

// -- tiny local helpers (brain-private) ------------------------------------

function ai(ctx: BrainContext) {
  if (!ctx.self.ai) throw new Error(`wraithBrain: actor ${ctx.self.id} has no ai data`);
  return ctx.self.ai;
}

function canAggro(ctx: BrainContext, cfg: WraithTuning): boolean {
  return playerDist(ctx) < cfg.aggroRadius * ctx.aggroScale && ctx.canSeePlayer;
}

function playerDist(ctx: BrainContext): number {
  return dist(ctx.self.sprite, ctx.player.sprite);
}

function dist(a: Vec2Like, b: Vec2Like): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function moveToward(ctx: BrainContext, target: Vec2Like, speed: number): number {
  const s = ctx.self.sprite;
  const d = dist(s, target);
  if (d < 1) {
    s.setVelocity(0, 0);
    return d;
  }
  s.setVelocity(((target.x - s.x) / d) * speed, ((target.y - s.y) / d) * speed);
  return d;
}
