import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
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
import { createRng, type Rng } from '../core/rng';
import { createNewGameState, type GameState } from '../core/state/GameState';
import { parseItemCatalog, type ItemCatalog } from '../data/itemCatalog';
import { ActorRegistry, type Actor } from '../entities/Actor';
import { Chest } from '../entities/Chest';
import { createGhoul, resetGhoulIds } from '../entities/Ghoul';
import { createPlayer } from '../entities/Player';
import { ActionMap } from '../input/ActionMap';
import { AISystem } from '../systems/AISystem';
import { CombatSystem } from '../systems/CombatSystem';
import { HealthSystem } from '../systems/HealthSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { ItemEffects } from '../systems/ItemEffects';
import { LootSystem } from '../systems/LootSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { StaminaSystem } from '../systems/StaminaSystem';
import { createFrameScratch, type GameSystem } from '../systems/System';
import { DebugOverlay } from '../ui/DebugOverlay';
import { Hud } from '../ui/Hud';
import { InventoryPanel } from '../ui/InventoryPanel';
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
  private rng!: Rng;
  private catalog!: ItemCatalog;

  /** ★ THE system order (§5):
   *  AI → Combat → Stamina → Movement → Interaction → Loot → Health.
   *  Requesters first (AI/Combat emit damage, request stamina), resource
   *  owners act (Stamina/Movement), world interactions resolve
   *  (Interaction/Loot), damage resolves last in one place (Health). */
  private gameSystems: GameSystem[] = [];

  private hud?: Hud;
  private debug?: DebugOverlay;
  private inventoryPanel!: InventoryPanel;
  private lastInput: InputSnapshot = NULL_INPUT;
  /** Simulation freeze while the inventory is open (§6: game-time pauses). */
  private inventoryOpen = false;
  /** Set on PlayerDied: stops simulation during the death fade. */
  private ending = false;

  constructor() {
    super(SceneKey.Play);
  }

  create(): void {
    this.state = createNewGameState(Date.now());
    this.rng = createRng(this.state.rngSeed);
    this.bus = new EventBus();
    this.actors = new ActorRegistry();
    this.ending = false;
    this.inventoryOpen = false;
    resetGhoulIds();

    // Item catalog: data asset, validated fail-loud at scene start (§10).
    this.catalog = parseItemCatalog(this.cache.json.get(AssetKey.ItemsData));

    // -- World -----------------------------------------------------------
    const world = createWorld(this);
    this.physics.world.setBounds(0, 0, world.widthPx, world.heightPx);

    // -- Player ----------------------------------------------------------
    this.player = createPlayer(this, world.spawn.x, world.spawn.y, this.state);
    this.player.sprite.setCollideWorldBounds(true);
    this.actors.add(this.player);
    this.state.player.position = { ...world.spawn };

    // -- Enemies & chests (spawn points are map DATA, §10) -----------------
    const enemyGroup = this.physics.add.group();
    for (const spawn of world.enemySpawns) {
      const ghoul = createGhoul(this, spawn.x, spawn.y, GHOUL_TUNING);
      this.actors.add(ghoul);
      enemyGroup.add(ghoul.sprite);
    }
    const chests = world.chestSpawns.map(
      (c) =>
        new Chest(this, c.id, c.x, c.y, this.state.worldFlags[`chest:${c.id}`] === true),
    );

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
    const lootSystem = new LootSystem(this, this.catalog, this.bus);
    this.gameSystems = [
      new AISystem(),
      new CombatSystem(this, PLAYER_COMBAT_TUNING),
      new StaminaSystem(STAMINA_TUNING),
      new MovementSystem(MOVEMENT_TUNING),
      new InteractionSystem(chests),
      lootSystem,
      healthSystem,
    ];

    // Event-driven services (not ticked): menu-time item use.
    const itemEffects = new ItemEffects(this.catalog, this.bus, this.state, this.player);

    // -- Death flow (scene transitions are the scene's business, §6) --------
    this.bus.on(GameEvent.PlayerDied, ({ playTimeMs }) => this.onPlayerDied(playTimeMs));

    // -- UI ------------------------------------------------------------------
    this.hud = new Hud();
    this.inventoryPanel = new InventoryPanel(this.state, this.catalog, this.bus);
    if (GAME_CONFIG.debugOverlay) this.debug = new DebugOverlay();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.hud?.destroy();
      this.debug?.destroy();
      this.inventoryPanel.destroy();
      healthSystem.destroy();
      lootSystem.destroy();
      itemEffects.destroy();
      this.bus.clear(); // no stale handlers surviving into the next run
    });
  }

  override update(_time: number, delta: number): void {
    if (this.ending) return; // death fade: the world stands still

    // Input is sampled even while paused — the close-inventory key must work.
    this.lastInput = this.actionMap.snapshot();
    if (this.lastInput.inventoryPressed) this.toggleInventory();

    if (this.inventoryOpen) return; // simulation (and game-time) frozen

    this.state.playTimeMs += delta;
    const ctx = {
      state: this.state,
      input: this.lastInput,
      dtMs: delta,
      frame: createFrameScratch(),
      bus: this.bus,
      actors: this.actors,
      player: this.player,
      rng: this.rng,
    };
    for (const system of this.gameSystems) system.update(ctx);

    this.hud?.update(this.state);
    this.debug?.update({
      fps: Math.round(this.game.loop.actualFps),
      hp: Math.round(this.state.player.health),
      stamina: Math.round(this.state.player.stamina),
      enemies: this.actors.enemies().length,
      items: this.state.player.inventory.reduce((n, s) => n + s.quantity, 0),
    });
  }

  private toggleInventory(): void {
    this.inventoryOpen = !this.inventoryOpen;
    if (this.inventoryOpen) {
      this.physics.pause(); // bodies freeze mid-step; no drift while browsing
      this.inventoryPanel.show();
    } else {
      this.physics.resume();
      this.inventoryPanel.hide();
      this.hud?.update(this.state); // reflect any potions used while paused
    }
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
