import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
import { createHurtData } from '../core/combat';
import type { GameState } from '../core/state/GameState';
import type { Actor } from './Actor';

/**
 * Player factory (composition over inheritance, §4): assembles the player
 * Actor — sprite + plain-data components. Behavior lives in systems.
 *
 * Health is initialized FROM GameState (the serializable source of truth at
 * spawn); at runtime the Actor owns it and HealthSystem mirrors it back.
 */
export function createPlayer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  state: GameState,
): Actor {
  ensurePlaceholderTexture(scene);

  const sprite = scene.physics.add.sprite(x, y, AssetKey.PlayerTexture);
  // Collision box slightly smaller than the visual, biased to the feet —
  // standard top-down practice so the head can overlap walls "behind" it.
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body.setSize(10, 10);
  body.setOffset(1, 6);

  return {
    id: 'player',
    kind: 'player',
    sprite,
    health: { current: state.player.health, max: state.player.maxHealth },
    hurt: createHurtData(),
    facing: { x: 0, y: 1 }, // faces "down" until first movement
  };
}

function ensurePlaceholderTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(AssetKey.PlayerTexture)) return;
  const g = scene.add.graphics();
  g.fillStyle(0x8a2f2f, 1); // cloak
  g.fillRect(0, 4, 12, 12);
  g.fillStyle(0xd8d2c4, 1); // face
  g.fillRect(3, 0, 6, 5);
  g.generateTexture(AssetKey.PlayerTexture, 12, 16);
  g.destroy();
}
