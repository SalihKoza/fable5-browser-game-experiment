import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
import type { WraithTuning } from '../config/tuning';
import { createHurtData } from '../core/combat';
import { createWraithBrain } from '../systems/wraithBrain';
import type { Actor } from './Actor';

let nextWraithId = 0;

export function resetWraithIds(): void {
  nextWraithId = 0;
}

/**
 * Wraith factory — same composition recipe as the ghoul (sprite + components
 * + brain), different data. Semi-transparent by design: it reads as a ghost
 * and telegraphs its solidify-to-strike behavior.
 */
export function createWraith(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tuning: WraithTuning,
): Actor {
  ensurePlaceholderTexture(scene);

  const sprite = scene.physics.add.sprite(x, y, AssetKey.WraithTexture);
  sprite.setAlpha(0.85);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body.setSize(9, 10);
  body.setOffset(1, 4);

  return {
    id: `wraith-${nextWraithId++}`,
    kind: 'wraith',
    sprite,
    health: { current: tuning.maxHealth, max: tuning.maxHealth },
    hurt: createHurtData(),
    facing: { x: 0, y: 1 },
    ai: { home: { x, y }, stateTimerMs: 0, patrolTarget: null },
    brain: createWraithBrain(tuning),
  };
}

function ensurePlaceholderTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(AssetKey.WraithTexture)) return;
  const g = scene.add.graphics();
  g.fillStyle(0x9aa4c9, 1); // pale shroud
  g.fillRect(1, 2, 9, 9);
  g.fillRect(0, 11, 3, 3); // ragged hem
  g.fillRect(5, 11, 3, 3);
  g.fillStyle(0x1a1a2e, 1); // hood void
  g.fillRect(2, 3, 7, 4);
  g.fillStyle(0xd9e2ff, 1); // eyes
  g.fillRect(3, 4, 2, 2);
  g.fillRect(7, 4, 1, 2);
  g.generateTexture(AssetKey.WraithTexture, 11, 14);
  g.destroy();
}
