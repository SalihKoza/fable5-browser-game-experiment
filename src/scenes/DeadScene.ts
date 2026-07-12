import Phaser from 'phaser';
import { GAME_CONFIG, SceneKey } from '../config/game';

/**
 * DeadScene: terminal state of the scene-flow FSM (§6). Shows the run's
 * numbers and restarts cleanly. Death burned the save (ADR-002: runs are
 * mortal), so restarting always begins a fresh run.
 */
export class DeadScene extends Phaser.Scene {
  private playTimeMs = 0;
  private kills = 0;

  constructor() {
    super(SceneKey.Dead);
  }

  init(data: { playTimeMs?: number; kills?: number }): void {
    this.playTimeMs = data.playTimeMs ?? 0;
    this.kills = data.kills ?? 0;
  }

  create(): void {
    const { width, height } = GAME_CONFIG;
    this.cameras.main.setBackgroundColor('#050507');

    this.add
      .text(width / 2, height * 0.34, 'YOU DIED', {
        fontFamily: 'Georgia, serif',
        fontSize: '30px',
        color: '#8a2f2f',
      })
      .setOrigin(0.5);

    const seconds = (this.playTimeMs / 1000).toFixed(0);
    const kills = this.kills === 1 ? '1 kill' : `${this.kills} kills`;
    this.add
      .text(width / 2, height * 0.52, `${seconds}s survived · ${kills}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#6b6558',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.62, 'your saved journey is ash', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#4a4438',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height * 0.74, 'press any key to rise again', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#6b6558',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });

    // Brief input lockout so the killing blow's button-mash doesn't skip the screen.
    this.time.delayedCall(600, () => {
      this.input.keyboard?.once('keydown', () =>
        this.scene.start(SceneKey.Play, { continue: false }),
      );
      this.input.once('pointerdown', () =>
        this.scene.start(SceneKey.Play, { continue: false }),
      );
    });
  }
}
