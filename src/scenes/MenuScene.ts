import Phaser from 'phaser';
import { GAME_CONFIG, SceneKey } from '../config/game';

/**
 * MenuScene: title screen. Deliberately minimal — its architectural job is to
 * prove the scene-flow FSM (Boot → Preload → Menu → Play) works end to end.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Menu);
  }

  create(): void {
    const { width, height } = GAME_CONFIG;

    this.add
      .text(width / 2, height * 0.38, 'HOLLOWMERE', {
        fontFamily: 'Georgia, serif',
        fontSize: '32px',
        color: '#d8d2c4',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height * 0.62, 'press any key to descend', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#6b6558',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.25,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard?.once('keydown', () => this.scene.start(SceneKey.Play));
    this.input.once('pointerdown', () => this.scene.start(SceneKey.Play));
  }
}
