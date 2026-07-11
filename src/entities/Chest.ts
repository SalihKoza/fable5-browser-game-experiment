import Phaser from 'phaser';
import { AssetKey } from '../config/assets';

/**
 * Chest: a static world interactable. Not an Actor (no health, no brain, no
 * physics body) — modeling it as one would be complexity for its own sake.
 * Its id comes from the Tiled object id, so `worldFlags["chest:<id>"]`
 * identifies it stably across runs — exactly what the save system will read.
 */
export class Chest {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly prompt: Phaser.GameObjects.Text;
  private isOpen: boolean;

  constructor(
    scene: Phaser.Scene,
    readonly id: string,
    readonly x: number,
    readonly y: number,
    alreadyOpened: boolean,
  ) {
    ensureChestTextures(scene);
    this.isOpen = alreadyOpened;
    this.sprite = scene.add.sprite(
      x,
      y,
      alreadyOpened ? AssetKey.ChestOpenTexture : AssetKey.ChestTexture,
    );

    this.prompt = scene.add
      .text(x, y - 12, 'E', { fontFamily: 'monospace', fontSize: '8px', color: '#d8d2c4' })
      .setOrigin(0.5)
      .setVisible(false);
  }

  get opened(): boolean {
    return this.isOpen;
  }

  open(): void {
    this.isOpen = true;
    this.sprite.setTexture(AssetKey.ChestOpenTexture);
    this.prompt.setVisible(false);
  }

  /** "Press E" affordance, driven by InteractionSystem proximity checks. */
  setPromptVisible(visible: boolean): void {
    if (!this.isOpen) this.prompt.setVisible(visible);
  }
}

function ensureChestTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(AssetKey.ChestTexture)) return;
  let g = scene.add.graphics();
  g.fillStyle(0x6e4a2f, 1); // wooden body
  g.fillRect(0, 2, 14, 10);
  g.fillStyle(0x3a2a1a, 1); // lid seam + lock
  g.fillRect(0, 5, 14, 2);
  g.fillRect(6, 4, 2, 4);
  g.generateTexture(AssetKey.ChestTexture, 14, 12);
  g.destroy();

  g = scene.add.graphics();
  g.fillStyle(0x4a331f, 1); // opened: darker, hollow
  g.fillRect(0, 2, 14, 10);
  g.fillStyle(0x14100a, 1);
  g.fillRect(2, 4, 10, 6);
  g.generateTexture(AssetKey.ChestOpenTexture, 14, 12);
  g.destroy();
}
