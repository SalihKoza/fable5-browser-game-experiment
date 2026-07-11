import Phaser from 'phaser';
import { AssetKey } from '../config/assets';

/**
 * Player factory (composition over inheritance, §4): builds a physics-enabled
 * sprite — no Player class hierarchy. Behavior lives in systems; this file
 * only assembles the body.
 *
 * Placeholder pipeline (§10): the texture is generated at runtime (a 12×16
 * two-tone figure) until real art replaces it via the manifest.
 */
export function createPlayer(
  scene: Phaser.Scene,
  x: number,
  y: number,
): Phaser.Physics.Arcade.Sprite {
  ensurePlaceholderTexture(scene);

  const player = scene.physics.add.sprite(x, y, AssetKey.PlayerTexture);
  // Collision box slightly smaller than the visual, biased to the feet —
  // standard top-down practice so the head can overlap walls "behind" it.
  const body = player.body as Phaser.Physics.Arcade.Body;
  body.setSize(10, 10);
  body.setOffset(1, 6);
  return player;
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
