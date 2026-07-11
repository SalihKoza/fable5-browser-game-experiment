import Phaser from 'phaser';
import { GAME_CONFIG, SceneKey } from '../config/game';
import { MOVEMENT_TUNING, STAMINA_TUNING } from '../config/tuning';
import { NULL_INPUT, type InputSnapshot } from '../core/input';
import { createNewGameState, type GameState } from '../core/state/GameState';
import { createPlayer } from '../entities/Player';
import { ActionMap } from '../input/ActionMap';
import { MovementSystem } from '../systems/MovementSystem';
import { StaminaSystem } from '../systems/StaminaSystem';
import { createFrameScratch, type GameSystem } from '../systems/System';
import { DebugOverlay } from '../ui/DebugOverlay';
import { Hud } from '../ui/Hud';
import { createWorld } from '../world/createWorld';

/**
 * PlayScene: owns the run's GameState and executes the gameplay systems in
 * their documented order (ARCHITECTURE.md §5). Scenes stay thin: this file
 * wires world + entities + systems; behavior lives in the systems.
 */
export class PlayScene extends Phaser.Scene {
  private state!: GameState;
  private actionMap!: ActionMap;
  private player!: Phaser.Physics.Arcade.Sprite;

  /** ★ THE system order. One array, one file, deliberate (§5). */
  private gameSystems: GameSystem[] = [];

  private hud?: Hud;
  private debug?: DebugOverlay;
  private lastInput: InputSnapshot = NULL_INPUT;

  constructor() {
    super(SceneKey.Play);
  }

  create(): void {
    this.state = createNewGameState(Date.now());

    // -- World -----------------------------------------------------------
    const world = createWorld(this);
    this.physics.world.setBounds(0, 0, world.widthPx, world.heightPx);

    // -- Player ----------------------------------------------------------
    this.player = createPlayer(this, world.spawn.x, world.spawn.y);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, world.walls);
    this.state.player.position = { ...world.spawn };

    // -- Camera ----------------------------------------------------------
    // Lerped follow: the camera trails slightly, which reads as weight.
    this.cameras.main.setBounds(0, 0, world.widthPx, world.heightPx);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setBackgroundColor('#0a0a0f');

    // -- Input & systems (ORDER MATTERS, §5) -------------------------------
    // stamina first: it decides frame.sprinting, movement consumes it.
    this.actionMap = new ActionMap(this);
    this.gameSystems = [
      new StaminaSystem(STAMINA_TUNING),
      new MovementSystem(this.player, MOVEMENT_TUNING),
    ];

    // -- UI ----------------------------------------------------------------
    this.hud = new Hud();
    if (GAME_CONFIG.debugOverlay) this.debug = new DebugOverlay();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.hud?.destroy();
      this.debug?.destroy();
    });
  }

  override update(_time: number, delta: number): void {
    this.state.playTimeMs += delta;

    // One snapshot per tick (§9); one scratch object per tick (§5).
    this.lastInput = this.actionMap.snapshot();
    const ctx = {
      state: this.state,
      input: this.lastInput,
      dtMs: delta,
      frame: createFrameScratch(),
    };
    for (const system of this.gameSystems) system.update(ctx);

    this.hud?.update(this.state);
    this.debug?.update({
      fps: Math.round(this.game.loop.actualFps),
      pos: `${Math.round(this.player.x)},${Math.round(this.player.y)}`,
      stamina: Math.round(this.state.player.stamina),
      sprint: ctx.frame.sprinting ? 'yes' : 'no',
    });
  }
}
