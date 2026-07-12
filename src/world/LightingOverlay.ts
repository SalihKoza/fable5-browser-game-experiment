import type Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game';

export interface LightSource {
  /** World coordinates. */
  x: number;
  y: number;
  radius: number;
}

/**
 * The darkness pass (ARCHITECTURE.md §7) — the game's signature look AND a
 * mechanic: in the hollow, the torch radius IS your safety.
 *
 * Implementation: the documented ADR-001 fallback — a screen-sized canvas,
 * redrawn per frame: fill near-black at the zone's ambient alpha, then punch
 * out radial gradients at each light (destination-out), plus a static
 * vignette. Chosen over Phaser's light pipeline for zero API risk and total
 * control; at 480×270 the fill cost is trivial.
 *
 * Presentation-only: reads positions, never touches GameState. Torch flicker
 * uses Math.random deliberately — simulation determinism is unaffected.
 */
export class LightingOverlay {
  private readonly texture: Phaser.Textures.CanvasTexture;
  private readonly image: Phaser.GameObjects.Image;
  private ambient: number;
  private target: number;
  private t = 0;

  constructor(scene: Phaser.Scene, initialAmbient: number) {
    const { width, height } = GAME_CONFIG;
    const existing = scene.textures.exists('darkness-overlay');
    if (existing) scene.textures.remove('darkness-overlay');
    const texture = scene.textures.createCanvas('darkness-overlay', width, height);
    if (!texture) throw new Error('LightingOverlay: could not create canvas texture');
    this.texture = texture;
    this.image = scene.add
      .image(0, 0, 'darkness-overlay')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(1500);
    this.ambient = initialAmbient;
    this.target = initialAmbient;
  }

  /** Zone transitions steer here; update() eases toward it (no light pops). */
  setTargetAmbient(a: number): void {
    this.target = a;
  }

  update(dtMs: number, camera: Phaser.Cameras.Scene2D.Camera, lights: LightSource[]): void {
    this.t += dtMs;
    // Ease ambient toward target: ~1s to close the gap feels like eyes adjusting.
    this.ambient += (this.target - this.ambient) * Math.min(1, (dtMs / 1000) * 2.5);

    const { width, height } = GAME_CONFIG;
    const ctx = this.texture.context;

    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = `rgba(4, 4, 10, ${this.ambient.toFixed(3)})`;
    ctx.fillRect(0, 0, width, height);

    // Static vignette on top of ambient — the frame always breathes dark.
    const vg = ctx.createRadialGradient(
      width / 2, height / 2, height * 0.45,
      width / 2, height / 2, height * 0.85,
    );
    vg.addColorStop(0, 'rgba(0,0,5,0)');
    vg.addColorStop(1, 'rgba(0,0,5,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, width, height);

    // Punch light holes (screen space).
    ctx.globalCompositeOperation = 'destination-out';
    for (const light of lights) {
      const sx = light.x - camera.scrollX;
      const sy = light.y - camera.scrollY;
      // Flicker: slow sine + tiny noise. Presentation-only randomness.
      const r =
        light.radius *
        (1 + 0.05 * Math.sin(this.t / 90) + (Math.random() - 0.5) * 0.04);
      if (sx < -r || sx > width + r || sy < -r || sy > height + r) continue;

      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, 'rgba(0,0,0,0.98)');
      g.addColorStop(0.55, 'rgba(0,0,0,0.55)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
    }

    this.texture.refresh();
  }

  destroy(): void {
    this.image.destroy();
    this.texture.destroy();
  }
}
