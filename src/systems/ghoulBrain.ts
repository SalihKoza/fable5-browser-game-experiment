import type { GhoulTuning } from '../config/tuning';
import { GameEvent } from '../core/events';
import { Fsm } from '../core/fsm';
import type { Vec2Like } from '../core/state/GameState';
import type { Brain, BrainContext } from '../entities/Actor';

/**
 * Ghoul AI: idle → patrol → chase → windup → recover (ARCHITECTURE.md §5),
 * built on the generic core/fsm. The brain is the only place that decides
 * what a ghoul WANTS; damage still flows through the event bus and is applied
 * by HealthSystem alone.
 *
 * Perception is distance-based for now; line-of-sight raycasts arrive with
 * the darkness mechanic in Phase 4, where they become meaningful.
 */
export function createGhoulBrain(cfg: GhoulTuning): Brain {
  const fsm = new Fsm<BrainContext>(
    {
      idle: {
        onEnter: (ctx) => {
          ai(ctx).stateTimerMs = cfg.idlePauseMs;
          ctx.self.sprite.setVelocity(0, 0);
        },
        update: (ctx) => {
          if (playerDist(ctx) < cfg.aggroRadius) return 'chase';
          ai(ctx).stateTimerMs -= ctx.dtMs;
          return ai(ctx).stateTimerMs <= 0 ? 'patrol' : undefined;
        },
      },

      patrol: {
        onEnter: (ctx) => {
          // Wander near HOME, not near wherever the last chase ended —
          // this passively walks leashed ghouls back to their posts.
          const { home } = ai(ctx);
          const angle = Math.random() * Math.PI * 2;
          const r = cfg.patrolRadius * (0.4 + Math.random() * 0.6);
          ai(ctx).patrolTarget = {
            x: home.x + Math.cos(angle) * r,
            y: home.y + Math.sin(angle) * r,
          };
        },
        update: (ctx) => {
          if (playerDist(ctx) < cfg.aggroRadius) return 'chase';
          const target = ai(ctx).patrolTarget;
          if (!target || moveToward(ctx, target, cfg.patrolSpeed) < 4) return 'idle';
          return undefined;
        },
      },

      chase: {
        update: (ctx) => {
          const d = playerDist(ctx);
          if (d > cfg.leashRadius) return 'idle'; // anti-kiting leash
          if (d <= cfg.attackRange) return 'windup';
          moveToward(ctx, ctx.player.sprite, cfg.chaseSpeed);
          return undefined;
        },
      },

      // Telegraphed strike: the pause + tint is the player's chance to react.
      windup: {
        onEnter: (ctx) => {
          ai(ctx).stateTimerMs = cfg.windupMs;
          ctx.self.sprite.setVelocity(0, 0);
          ctx.self.sprite.setTint(0xd8b13f);
        },
        update: (ctx) => {
          ai(ctx).stateTimerMs -= ctx.dtMs;
          if (ai(ctx).stateTimerMs > 0) return undefined;
          ctx.self.sprite.clearTint();
          // strikeRange > attackRange: a small backpedal doesn't cheat the hit.
          if (playerDist(ctx) <= cfg.strikeRange) {
            ctx.bus.emit(GameEvent.EntityDamaged, {
              targetId: ctx.player.id,
              amount: cfg.damage,
              sourceX: ctx.self.sprite.x,
              sourceY: ctx.self.sprite.y,
              knockbackForce: cfg.knockbackForce,
            });
          }
          return 'recover';
        },
      },

      recover: {
        onEnter: (ctx) => {
          ai(ctx).stateTimerMs = cfg.recoverMs;
          ctx.self.sprite.setVelocity(0, 0);
        },
        update: (ctx) => {
          ai(ctx).stateTimerMs -= ctx.dtMs;
          return ai(ctx).stateTimerMs <= 0 ? 'chase' : undefined;
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
  if (!ctx.self.ai) throw new Error(`ghoulBrain: actor ${ctx.self.id} has no ai data`);
  return ctx.self.ai;
}

function playerDist(ctx: BrainContext): number {
  return dist(ctx.self.sprite, ctx.player.sprite);
}

function dist(a: Vec2Like, b: Vec2Like): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Steer toward a point; returns remaining distance. */
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
