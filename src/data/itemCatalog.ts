/**
 * Item catalog: types + validation for public/assets/data/items.json
 * (ARCHITECTURE.md §10: data as assets, validated at load, fail LOUD).
 * Adding an item = one JSON entry; no system changes.
 */
export interface ItemDef {
  id: string;
  name: string;
  description: string;
  /** Max quantity per inventory stack. */
  maxStack: number;
  /** Placeholder pickup tint (hex like "#5d8a4a") until real sprites exist. */
  color: string;
  /** Present only on usable items. */
  use?: { heal: number };
}

export class ItemCatalog {
  private readonly items: Map<string, ItemDef>;

  constructor(defs: ItemDef[]) {
    this.items = new Map(defs.map((d) => [d.id, d]));
  }

  get(id: string): ItemDef {
    const def = this.items.get(id);
    // A missing item id is a data bug (loot table ↔ catalog mismatch):
    // crash at the source instead of rendering "undefined" in the UI.
    if (!def) throw new Error(`ItemCatalog: unknown item id "${id}"`);
    return def;
  }

  has(id: string): boolean {
    return this.items.has(id);
  }
}

/** Validates raw JSON into a catalog. Throws with a precise message on bad data. */
export function parseItemCatalog(raw: unknown): ItemCatalog {
  if (typeof raw !== 'object' || raw === null || !Array.isArray((raw as { items?: unknown }).items))
    throw new Error('items.json: expected { "items": [...] }');

  const defs = (raw as { items: unknown[] }).items.map((item, i) => {
    const o = item as Record<string, unknown>;
    const fail = (msg: string): never => {
      throw new Error(`items.json entry #${i} (${String(o.id ?? '?')}): ${msg}`);
    };
    if (typeof o.id !== 'string' || o.id === '') fail('missing id');
    if (typeof o.name !== 'string') fail('missing name');
    if (typeof o.description !== 'string') fail('missing description');
    if (typeof o.maxStack !== 'number' || o.maxStack < 1) fail('maxStack must be >= 1');
    if (typeof o.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(o.color))
      fail('color must be "#rrggbb"');
    if (o.use !== undefined) {
      const use = o.use as Record<string, unknown>;
      if (typeof use.heal !== 'number' || use.heal <= 0) fail('use.heal must be > 0');
    }
    return o as unknown as ItemDef;
  });

  const ids = new Set(defs.map((d) => d.id));
  if (ids.size !== defs.length) throw new Error('items.json: duplicate item ids');

  return new ItemCatalog(defs);
}
