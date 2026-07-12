import type Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game';

const FOG_TEXTURE = 'fog-blob';

/**
 * Forest fog: three soft blobs drifting slowly in screen space, fading in
 * when the player is inside a fog zone. Deliberately screen-space (not
 * world-space particles): at 480×270 the drift READS as rolling mist and
 * costs three sprites. Presentation-only — never touches GameState.
 */
export class FogLayer {
  private readonly images: Phaser.GameObjects.Image[] = [];
  private current = 0;
  private target = 0;
  private t = 0;

  constructor(scene: Phaser.Scene) {
    ensureFogTexture(scene);
    for (let i = 0; i < 3; i++) {
      this.images.push(
        scene.add
          .image(0, 0, FOG_TEXTURE)
          .setScrollFactor(0)
          .setDepth(1400) // below the darkness overlay (1500)
          .setScale(3.2 + i * 0.9)
          .setTint(0x8a9a8e)
          .setAlpha(0),
      );
    }
  }

  update(dtMs: number, active: boolean): void {
    this.t += dtMs;
    this.target = active ? 0.09 : 0;
    this.current += (this.target - this.current) * Math.min(1, (dtMs / 1000) * 1.5);
    if (this.current < 0.002 && this.target === 0) return; // fully faded: skip drift math

    const { width, height } = GAME_CONFIG;
    this.images.forEach((img, i) => {
      img.setAlpha(this.current * (0.75 + i * 0.25));
      // Each blob follows its own slow lissajous drift — mist, not wallpaper.
      img.x = width / 2 + Math.sin(this.t / (9000 + i * 2600) + i * 2.1) * (width * 0.45);
      img.y = height / 2 + Math.cos(this.t / (11000 + i * 1900) + i * 1.3) * (height * 0.4);
    });
  }

  destroy(): void {
    for (const img of this.images) img.destroy();
  }
}

function ensureFogTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(FOG_TEXTURE)) return;
  const size = 128;
  const texture = scene.textures.createCanvas(FOG_TEXTURE, size, size);
  if (!texture) return;
  const ctx = texture.context;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.5)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.15)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  texture.refresh();
}
