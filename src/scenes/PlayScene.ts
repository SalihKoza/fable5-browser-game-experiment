import Phaser from 'phaser';
import { GAME_CONFIG, SceneKey } from '../config/game';
import { createNewGameState, type GameState } from '../core/state/GameState';
import { DebugOverlay } from '../ui/DebugOverlay';

/**
 * PlayScene: owns the run's GameState and (from Phase 1 on) executes the
 * gameplay systems in their documented order every update.
 *
 * Phase 0 scope: prove the loop. A placeholder "player" renders, GameState
 * exists and accumulates play time, and the debug overlay reads live data.
 */
export class PlayScene extends Phaser.Scene {
  private state!: GameState;
  private debug?: DebugOverlay;
  private playerPlaceholder!: Phaser.GameObjects.Rectangle;

  constructor() {
    super(SceneKey.Play);
  }

  create(): void {
    const { width, height } = GAME_CONFIG;
    this.state = createNewGameState(Date.now());
    this.state.player.position = { x: width / 2, y: height / 2 };

    this.cameras.main.setBackgroundColor('#101018');

    // Placeholder-first pipeline (§10): the player is a labeled rectangle
    // until real art exists. Gameplay is never blocked on assets.
    this.playerPlaceholder = this.add.rectangle(
      this.state.player.position.x,
      this.state.player.position.y,
      12,
      16,
      0x8a2f2f,
    );
    this.add
      .text(width / 2, height / 2 - 18, 'player', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#6b6558',
      })
      .setOrigin(0.5);

    // "Torch" pulse — a stand-in heartbeat proving tweens/loop are alive.
    this.tweens.add({
      targets: this.playerPlaceholder,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    if (GAME_CONFIG.debug) {
      this.debug = new DebugOverlay();
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.debug?.destroy());
  }

  override update(_time: number, delta: number): void {
    this.state.playTimeMs += delta;

    // Phase 1+: systems run here, in one documented order (ARCHITECTURE.md §5):
    // for (const system of this.systems) system.update(this.state, snapshot, dt)

    this.debug?.update({
      fps: Math.round(this.game.loop.actualFps),
      scene: SceneKey.Play,
      playTime: `${(this.state.playTimeMs / 1000).toFixed(1)}s`,
    });
  }
}
