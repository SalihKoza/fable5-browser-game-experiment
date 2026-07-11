import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
import { CHEST_LOOT, GHOUL_LOOT } from '../config/lootTables';
import { LOOT_TUNING } from '../config/tuning';
import { addItem } from '../core/inventory';
import { rollLoot, type LootDrop, type LootTable } from '../core/loot';
import { GameEvent } from '../core/events';
import type { GameBus } from '../core/events';
import type { ItemCatalog } from '../data/itemCatalog';
import type { GameSystem, SystemContext } from './System';

/**
 * Owns ground loot end-to-end: spawning drops (from EnemyDied / ChestOpened
 * events) and collecting them (walk-over). Spawn and collect share the pickup
 * collection, so they live in ONE system — splitting them (as the original
 * doc sketched) would force a third module just to hold shared state.
 *
 * Pickups are not Actors and not physics bodies: they're sprites + data,
 * collected by a radius check — same "geometry, not physics" reasoning as
 * attack hitboxes (phase-02 report).
 */
interface Pickup {
  itemId: string;
  quantity: number;
  sprite: Phaser.GameObjects.Sprite;
}

/** A loot source that died/opened this tick; rolled in update() with ctx.rng. */
interface PendingRoll {
  table: LootTable;
  x: number;
  y: number;
}

export class LootSystem implements GameSystem {
  readonly name = 'loot';

  private pickups: Pickup[] = [];
  private readonly pending: PendingRoll[] = [];
  private readonly unsubscribes: (() => void)[];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly catalog: ItemCatalog,
    bus: GameBus,
  ) {
    ensurePickupTexture(scene);
    // Handlers only QUEUE; rolls happen in update() where ctx.rng is available —
    // keeps all randomness on the run's seeded stream (§6).
    this.unsubscribes = [
      bus.on(GameEvent.EnemyDied, (e) =>
        this.pending.push({ table: GHOUL_LOOT, x: e.x, y: e.y }),
      ),
      bus.on(GameEvent.ChestOpened, (e) =>
        this.pending.push({ table: CHEST_LOOT, x: e.x, y: e.y }),
      ),
    ];
  }

  destroy(): void {
    for (const off of this.unsubscribes) off();
  }

  update(ctx: SystemContext): void {
    // 1. Spawn queued drops (rolled on the seeded rng).
    for (const roll of this.pending.splice(0)) {
      this.spawnDrops(rollLoot(roll.table, ctx.rng), roll.x, roll.y, ctx);
    }

    // 2. Collect: walk-over pickup within radius.
    const px = ctx.player.sprite.x;
    const py = ctx.player.sprite.y;
    this.pickups = this.pickups.filter((p) => {
      if (Math.hypot(p.sprite.x - px, p.sprite.y - py) > LOOT_TUNING.pickupRadius)
        return true;
      return !this.collect(p, ctx);
    });
  }

  /** @returns true if fully collected (pickup should disappear). */
  private collect(p: Pickup, ctx: SystemContext): boolean {
    const def = this.catalog.get(p.itemId);
    const result = addItem(ctx.state.player.inventory, p.itemId, p.quantity, {
      maxStack: def.maxStack,
      maxSlots: LOOT_TUNING.inventorySlots,
    });
    const taken = p.quantity - result.overflow;
    if (taken === 0) return false; // inventory full: leave it on the ground

    ctx.state.player.inventory = result.slots;
    ctx.bus.emit(GameEvent.ItemPickedUp, { itemId: p.itemId, quantity: taken });
    ctx.bus.emit(GameEvent.InventoryChanged, {});
    this.floatText(p.sprite.x, p.sprite.y, `+${taken} ${def.name}`);

    if (result.overflow > 0) {
      p.quantity = result.overflow;
      return false;
    }
    p.sprite.destroy();
    return true;
  }

  private spawnDrops(drops: LootDrop[], x: number, y: number, ctx: SystemContext): void {
    for (const drop of drops) {
      const def = this.catalog.get(drop.itemId);
      // Scatter so multiple drops don't stack invisibly.
      const angle = ctx.rng() * Math.PI * 2;
      const dist = 4 + ctx.rng() * 8;
      const sprite = this.scene.add
        .sprite(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, AssetKey.PickupTexture)
        .setTint(hexToInt(def.color));
      // Idle bob: reads as "collectible" without any tutorial text.
      this.scene.tweens.add({
        targets: sprite,
        y: sprite.y - 2,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.pickups.push({ itemId: drop.itemId, quantity: drop.quantity, sprite });
    }
  }

  private floatText(x: number, y: number, text: string): void {
    const t = this.scene.add
      .text(x, y - 8, text, { fontFamily: 'monospace', fontSize: '8px', color: '#d8d2c4' })
      .setOrigin(0.5)
      .setDepth(1000);
    this.scene.tweens.add({
      targets: t,
      y: y - 22,
      alpha: 0,
      duration: 700,
      onComplete: () => t.destroy(),
    });
  }
}

function hexToInt(hex: string): number {
  return parseInt(hex.slice(1), 16);
}

function ensurePickupTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(AssetKey.PickupTexture)) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1); // white diamond; per-item color applied via tint
  // Two triangles instead of fillPoints: Phaser 4's fillPoints wants real
  // Vector2 instances — needless ceremony for a static 8x8 placeholder.
  g.fillTriangle(4, 0, 8, 4, 0, 4);
  g.fillTriangle(0, 4, 8, 4, 4, 8);
  g.generateTexture(AssetKey.PickupTexture, 8, 8);
  g.destroy();
}
