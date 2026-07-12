import Phaser from 'phaser';
import { GAME_CONFIG, SceneKey } from '../config/game';
import { SaveManager } from '../core/save/SaveManager';

/**
 * MenuScene: title, controls, and the new-game / continue fork (§6).
 * The only scene that OFFERS loading; PlayScene does the actual restore.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Menu);
  }

  create(): void {
    const { width, height } = GAME_CONFIG;
    const saves = new SaveManager(window.localStorage);
    const hasSave = saves.hasSave();

    this.add
      .text(width / 2, height * 0.22, 'HOLLOWMERE', {
        fontFamily: 'Georgia, serif',
        fontSize: '32px',
        color: '#d8d2c4',
      })
      .setOrigin(0.5);

    const controls = [
      'WASD / arrows — move        shift — sprint',
      'J / space / click — attack  E — interact',
      'I / tab — inventory         H — use herb',
      'M — mute',
    ];
    this.add
      .text(width / 2, height * 0.48, controls.join('\n'), {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#6b6558',
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5);

    const options = hasSave
      ? 'N — new game      C — continue'
      : 'press any key to descend';
    const prompt = this.add
      .text(width / 2, height * 0.76, options, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#8a2f2f',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.35, duration: 900, yoyo: true, repeat: -1 });

    const startNew = (): void => {
      saves.clear();
      this.scene.start(SceneKey.Play, { continue: false });
    };
    const startContinue = (): void => {
      this.scene.start(SceneKey.Play, { continue: true });
    };

    if (hasSave) {
      this.input.keyboard?.on('keydown-N', startNew);
      this.input.keyboard?.on('keydown-C', startContinue);
      this.input.once('pointerdown', startContinue); // click = the friendly default
    } else {
      this.input.keyboard?.once('keydown', startNew);
      this.input.once('pointerdown', startNew);
    }
  }
}
