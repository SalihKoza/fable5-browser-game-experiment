import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
import type { GhoulTuning } from '../config/tuning';
import { createHurtData } from '../core/combat';
import { createGhoulBrain } from '../systems/ghoulBrain';
import type { Actor } from './Actor';

let nextGhoulId = 0;

/** Reset per run so restarts don't accumulate ids forever. */
export function resetGhoulIds(): void {
  nextGhoulId = 0;
}

/**
 * Ghoul factory: sprite + components + brain. Stats come from tuning (data),
 * not from code baked into a class — adding enemy VARIETY later means new
 * tuning + brain, not an inheritance tree (§4).
 */
export function createGhoul(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tuning: GhoulTuning,
): Actor {
  ensurePlaceholderTexture(scene);

  const sprite = scene.physics.add.sprite(x, y, AssetKey.GhoulTexture);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body.setSize(10, 10);
  body.setOffset(1, 4);

  return {
    id: `ghoul-${nextGhoulId++}`,
    kind: 'ghoul',
    sprite,
    health: { current: tuning.maxHealth, max: tuning.maxHealth },
    hurt: createHurtData(),
    facing: { x: 0, y: 1 },
    ai: { home: { x, y }, stateTimerMs: 0, patrolTarget: null },
    brain: createGhoulBrain(tuning),
  };
}

function ensurePlaceholderTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(AssetKey.GhoulTexture)) return;
  const g = scene.add.graphics();
  g.fillStyle(0x4a5d4a, 1); // hunched moss-grey body
  g.fillRect(0, 3, 12, 11);
  g.fillStyle(0x2e3a2e, 1); // head
  g.fillRect(2, 0, 8, 5);
  g.fillStyle(0xc9d34d, 1); // eyes
  g.fillRect(3, 1, 2, 2);
  g.fillRect(7, 1, 2, 2);
  g.generateTexture(AssetKey.GhoulTexture, 12, 14);
  g.destroy();
}
