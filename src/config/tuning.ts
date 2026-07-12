/**
 * Gameplay tuning — every "feel" number in one file so a balance pass never
 * hunts through systems. Values are px/s and ms.
 */
import type { MovementConfig } from '../core/movement';
import type { StaminaConfig } from '../core/stamina';
import type { ZoneId } from '../core/zones';

export const MOVEMENT_TUNING: MovementConfig = {
  walkSpeed: 70,
  sprintMultiplier: 1.6,
};

export const STAMINA_TUNING: StaminaConfig = {
  max: 100,
  drainPerSecond: 30,
  regenPerSecond: 24, // v1.0 balance: 22 → 24, less downtime between fights
  regenDelayMs: 700,
  restartThreshold: 15,
};

export const PLAYER_COMBAT_TUNING = {
  damage: 25,
  cooldownMs: 420,
  /** Press slightly early and the swing still fires when ready (§9). */
  bufferMs: 150,
  staminaCost: 12, // v1.0 balance: 15 → 12, ~8 swings on a full bar
  /** Hitbox center = player position + facing * reach. */
  reach: 14,
  hitboxWidth: 18,
  hitboxHeight: 18,
  hitboxLifeMs: 110,
  knockbackForce: 170,
} as const;

export const HURT_TUNING = {
  /** Player i-frames after a hit — readable, fair melee (§5). */
  playerInvulnMs: 600,
  /** While knocked back, the body belongs to physics, not to input/AI. */
  knockbackMs: 150,
  /** White hit-flash duration. */
  flashMs: 90,
} as const;

export const LOOT_TUNING = {
  /** Walk-over collection distance (px). */
  pickupRadius: 12,
  /** Chest interaction distance (px). */
  interactRadius: 20,
  /** Inventory capacity (slots, not items). */
  inventorySlots: 12,
} as const;

export interface GhoulTuning {
  maxHealth: number;
  patrolSpeed: number;
  chaseSpeed: number;
  aggroRadius: number;
  /** Beyond this the ghoul loses interest and drifts home (anti-kiting). */
  leashRadius: number;
  /** Close enough to begin a strike. */
  attackRange: number;
  /** The strike still lands slightly outside attackRange (backpedal-proof). */
  strikeRange: number;
  windupMs: number;
  recoverMs: number;
  damage: number;
  knockbackForce: number;
  idlePauseMs: number;
  patrolRadius: number;
}

export const GHOUL_TUNING: GhoulTuning = {
  maxHealth: 50,
  patrolSpeed: 35,
  chaseSpeed: 55,
  aggroRadius: 90,
  leashRadius: 150,
  attackRange: 18,
  strikeRange: 26,
  windupMs: 350,
  recoverMs: 550,
  damage: 15,
  knockbackForce: 150,
  idlePauseMs: 1100,
  patrolRadius: 48,
};

/** Wraith: fast, fragile, hit-and-run (see systems/wraithBrain.ts). */
export interface WraithTuning extends GhoulTuning {
  /** How long it slips away after a strike. */
  retreatMs: number;
  retreatSpeed: number;
}

export const WRAITH_TUNING: WraithTuning = {
  maxHealth: 30,
  patrolSpeed: 30,
  chaseSpeed: 78,
  aggroRadius: 110,
  leashRadius: 190,
  attackRange: 16,
  strikeRange: 24,
  windupMs: 200,
  recoverMs: 200, // unused by wraith brain (retreat replaces recover), kept for shape
  damage: 10,
  knockbackForce: 120,
  idlePauseMs: 800,
  patrolRadius: 60,
  retreatMs: 420,
  retreatSpeed: 65,
};

/** Per-zone atmosphere + perception (§7): the zone IS the difficulty dial. */
export const ZONE_TUNING: Record<
  ZoneId,
  { ambient: number; sightScale: number; fog: boolean; droneGain: number }
> = {
  ruins: { ambient: 0.5, sightScale: 1, fog: false, droneGain: 0.35 },
  forest: { ambient: 0.62, sightScale: 0.75, fog: true, droneGain: 0.55 },
  hollow: { ambient: 0.88, sightScale: 0.55, fog: false, droneGain: 0.85 },
};

export const LIGHT_TUNING = {
  /** The player's torch — in the hollow, this radius is your life. */
  torchRadius: 78,
  brazierRadius: 58,
} as const;
