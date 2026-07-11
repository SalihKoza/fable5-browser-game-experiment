import Phaser from 'phaser';
import { GAME_CONFIG, SceneKey } from '../config/game';
import {
  GHOUL_TUNING,
  MOVEMENT_TUNING,
  PLAYER_COMBAT_TUNING,
  STAMINA_TUNING,
} from '../config/tuning';
import { EventBus } from '../core/EventBus';
import { GameEvent, type GameBus } from '../core/events';
import { NULL_INPUT, type InputSnapshot } from '../core/input';
import { createNewGameState, type GameState } from '../core/state/GameState';
import { ActorRegistry, type Actor } from '../entities/Actor';
import { createGhoul, resetGhoulIds } from '../entities/Ghoul';
import { createPlayer } from '../entities/Player';
import { ActionMap } from '../input/ActionMap';
import { AISystem } from '../systems/AISystem';
import { CombatSystem } from '../systems/CombatSystem';
import { HealthSystem } from '../systems/HealthSystem';
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
  private bus!: GameBus;
  private actors!: ActorRegistry;
  private actionMap!: ActionMap;
  private player!: Actor;

  /** ★ THE system order (§5): AI → Combat → Stamina → Movement → Health.
   *  AI/Combat request (damage events, stamina spend); Stamina/Movement act
   *  on intents; Health resolves all damage last, in one place. */
  private gameSystems: GameSystem[] = [];

  private hud?: Hud;
  private debug?: DebugOverlay;
  private lastInput: InputSnapshot = NULL_INPUT;
  /** Set on PlayerDied: stops simulation during the death fade. */
  private ending = false;

  constructor() {
    super(SceneKey.Play);
  }

  create(): void {
    this.state = createNewGameState(Date.now());
    this.bus = new EventBus();
    this.actors = new ActorRegistry();
    this.ending = false;
    resetGhoulIds();

    // -- World -----------------------------------------------------------
    const world = createWorld(this);
    this.physics.world.setBounds(0, 0, world.widthPx, world.heightPx);

    // -- Player ----------------------------------------------------------
    this.player = createPlayer(this, world.spawn.x, world.spawn.y, this.state);
    this.player.sprite.setCollideWorldBounds(true);
    this.actors.add(this.player);
    this.state.player.position = { ...world.spawn };

    // -- Enemies (spawn points are map DATA, §10) --------------------------
    const enemyGroup = this.physics.add.group();
    for (const spawn of world.enemySpawns) {
      const ghoul = createGhoul(this, spawn.x, spawn.y, GHOUL_TUNING);
      this.actors.add(ghoul);
      enemyGroup.add(ghoul.sprite);
    }

    // -- Colliders (physical response is Arcade's job, §5) ----------------
    this.physics.add.collider(this.player.sprite, world.walls);
    this.physics.add.collider(enemyGroup, world.walls);
    this.physics.add.collider(enemyGroup, enemyGroup);
    this.physics.add.collider(this.player.sprite, enemyGroup);

    // -- Camera ------------------------------------------------------------
    this.cameras.main.setBounds(0, 0, world.widthPx, world.heightPx);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setBackgroundColor('#0a0a0f');

    // -- Input & systems (ORDER MATTERS, §5) --------------------------------
    this.actionMap = new ActionMap(this);
    const healthSystem = new HealthSystem(this, this.bus);
    this.gameSystems = [
      new AISystem(),
      new CombatSystem(this, PLAYER_COMBAT_TUNING),
      new StaminaSystem(STAMINA_TUNING),
      new MovementSystem(MOVEMENT_TUNING),
      healthSystem,
    ];

    // -- Death flow (scene transitions are the scene's business, §6) --------
    this.bus.on(GameEvent.PlayerDied, ({ playTimeMs }) => this.onPlayerDied(playTimeMs));

    // -- UI ------------------------------------------------------------------
    this.hud = new Hud();
    if (GAME_CONFIG.debugOverlay) this.debug = new DebugOverlay();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.hud?.destroy();
      this.debug?.destroy();
      healthSystem.destroy();
      this.bus.clear(); // no stale handlers surviving into the next run
    });
  }

  override update(_time: number, delta: number): void {
    if (this.ending) return; // death fade: the world stands still
    this.state.playTimeMs += delta;

    // One snapshot per tick (§9); one scratch object per tick (§5).
    this.lastInput = this.actionMap.snapshot();
    const ctx = {
      state: this.state,
      input: this.lastInput,
      dtMs: delta,
      frame: createFrameScratch(),
      bus: this.bus,
      actors: this.actors,
      player: this.player,
    };
    for (const system of this.gameSystems) system.update(ctx);

    this.hud?.update(this.state);
    this.debug?.update({
      fps: Math.round(this.game.loop.actualFps),
      hp: Math.round(this.state.player.health),
      stamina: Math.round(this.state.player.stamina),
      enemies: this.actors.enemies().length,
    });
  }

  private onPlayerDied(playTimeMs: number): void {
    if (this.ending) return;
    this.ending = true;
    this.player.sprite.setVelocity(0, 0);
    this.player.sprite.setTint(0x555555);
    this.cameras.main.fadeOut(700, 5, 5, 7);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SceneKey.Dead, { playTimeMs });
    });
  }
}
