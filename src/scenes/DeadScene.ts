import Phaser from 'phaser';
import { GAME_CONFIG, SceneKey } from '../config/game';

/**
 * DeadScene: terminal state of the scene-flow FSM (§6). Shows run stats and
 * restarts cleanly — PlayScene.create() builds a fresh run from scratch, so
 * "restart" is simply "start Play again"; nothing needs manual resetting.
 */
export class DeadScene extends Phaser.Scene {
  private playTimeMs = 0;

  constructor() {
    super(SceneKey.Dead);
  }

  init(data: { playTimeMs?: number }): void {
    this.playTimeMs = data.playTimeMs ?? 0;
  }

  create(): void {
    const { width, height } = GAME_CONFIG;
    this.cameras.main.setBackgroundColor('#050507');

    this.add
      .text(width / 2, height * 0.38, 'YOU DIED', {
        fontFamily: 'Georgia, serif',
        fontSize: '30px',
        color: '#8a2f2f',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.54, `you lasted ${(this.playTimeMs / 1000).toFixed(0)}s`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#6b6558',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height * 0.68, 'press any key to rise again', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#6b6558',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });

    // Brief input lockout so the killing blow's button-mash doesn't skip the screen.
    this.time.delayedCall(600, () => {
      this.input.keyboard?.once('keydown', () => this.scene.start(SceneKey.Play));
      this.input.once('pointerdown', () => this.scene.start(SceneKey.Play));
    });
  }
}
