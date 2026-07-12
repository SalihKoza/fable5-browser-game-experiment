#!/usr/bin/env python3
"""
Placeholder asset generator (ARCHITECTURE.md §10: placeholder-first pipeline).

Deterministically generates:
  - public/assets/sprites/world/tileset_placeholder.png  (8 tiles, 16x16)
  - public/assets/data/map_hollowmere.json               (Tiled-format map)

Tile IDs (firstgid=1):
  1 stone floor · 2 cracked floor · 3 wall · 4 mossy wall
  5 grass · 6 dark grass · 7 tree (solid) · 8 void stone

Map: 60x40 tiles (960x640 px), three zones:
  ruins  x[0,25)   — open stone, a ruined building, patrols
  forest x[25,45)  — grass + tree clusters, fog, carved paths
  hollow x[45,60)  — near-black void stone, wraiths, the climax chest

The outputs are committed; re-run only when changing the layout. When real
art arrives, only the PNG gets replaced — code never changes.

Usage: python3 tools/generate_placeholder_assets.py   (from repo root)
"""

import json
import random
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
TILE = 16
MAP_W, MAP_H = 60, 40
SEED = 1105  # deterministic output

# Zone boundaries in tile columns.
RUINS_X = (0, 25)
FOREST_X = (25, 45)
HOLLOW_X = (45, 60)

# Forest paths kept clear of trees (tile ranges, inclusive).
PATH_ROWS = range(18, 22)   # horizontal corridor
PATH_COLS = range(32, 35)   # vertical corridor


def build_tileset(path: Path) -> None:
    img = Image.new("RGBA", (TILE * 8, TILE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rng = random.Random(SEED)

    def base(i, color):
        d.rectangle([i * TILE, 0, (i + 1) * TILE - 1, TILE - 1], fill=(*color, 255))

    def speckle(i, color, n, jitter):
        for _ in range(n):
            px = i * TILE + rng.randrange(1, TILE - 1)
            py = rng.randrange(1, TILE - 1)
            c = tuple(max(0, v + rng.randint(-jitter, jitter)) for v in color)
            d.point((px, py), fill=(*c, 255))

    # 1 stone floor
    base(0, (26, 26, 34)); speckle(0, (26, 26, 34), 14, 6)
    # 2 cracked floor
    base(1, (23, 23, 31))
    d.line([TILE + 3, 4, TILE + 9, 11], fill=(14, 14, 20, 255))
    d.line([TILE + 9, 11, TILE + 13, 13], fill=(14, 14, 20, 255))
    # 3 wall
    base(2, (58, 58, 72))
    d.rectangle([2 * TILE, 0, 3 * TILE - 1, 3], fill=(74, 74, 90, 255))
    d.rectangle([2 * TILE, TILE - 3, 3 * TILE - 1, TILE - 1], fill=(38, 38, 50, 255))
    speckle(2, (58, 58, 72), 10, 8)
    # 4 mossy wall
    base(3, (54, 60, 62))
    d.rectangle([3 * TILE, 0, 4 * TILE - 1, 3], fill=(70, 78, 74, 255))
    speckle(3, (60, 84, 58), 12, 10)
    # 5 grass
    base(4, (24, 34, 26)); speckle(4, (34, 48, 34), 16, 8)
    # 6 dark grass
    base(5, (18, 27, 20)); speckle(5, (12, 20, 14), 12, 6)
    # 7 tree (solid): dense canopy
    base(6, (13, 24, 15))
    d.rectangle([6 * TILE + 2, 2, 7 * TILE - 3, TILE - 5], fill=(20, 36, 22, 255))
    d.rectangle([6 * TILE + 6, TILE - 4, 6 * TILE + 9, TILE - 1], fill=(30, 22, 14, 255))
    speckle(6, (24, 42, 26), 10, 8)
    # 8 void stone (hollow floor)
    base(7, (10, 10, 16)); speckle(7, (18, 14, 26), 10, 6)

    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def build_map(path: Path) -> None:
    rng = random.Random(SEED)
    ground = [0] * (MAP_W * MAP_H)
    walls = [0] * (MAP_W * MAP_H)

    def idx(x, y):
        return y * MAP_W + x

    def set_wall(x, y, tile=None):
        if 0 <= x < MAP_W and 0 <= y < MAP_H:
            walls[idx(x, y)] = tile if tile else (4 if rng.random() < 0.3 else 3)

    def set_tree(x, y):
        if 0 <= x < MAP_W and 0 <= y < MAP_H:
            walls[idx(x, y)] = 7

    # ---- ground per zone ----------------------------------------------------
    for y in range(MAP_H):
        for x in range(MAP_W):
            if x < FOREST_X[0]:
                ground[idx(x, y)] = 2 if rng.random() < 0.12 else 1
            elif x < HOLLOW_X[0]:
                ground[idx(x, y)] = 6 if rng.random() < 0.2 else 5
            else:
                ground[idx(x, y)] = 8

    # ---- borders -------------------------------------------------------------
    for x in range(MAP_W):
        set_wall(x, 0)
        set_wall(x, MAP_H - 1)
    for y in range(MAP_H):
        set_wall(0, y)
        set_wall(MAP_W - 1, y)

    # ---- ruins: a broken building + scattered pillars -------------------------
    for x in range(8, 17):       # building 8..16 x 6..13
        if x not in (11, 12):
            set_wall(x, 6)
        if x != 14:
            set_wall(x, 13)
    for y in range(6, 14):
        if y != 9:
            set_wall(8, y)
        if y != 10:
            set_wall(16, y)
    for px, py in [(5, 28), (6, 28), (19, 30), (20, 30), (10, 33), (11, 33),
                   (18, 17), (4, 8), (21, 7), (22, 7), (14, 22)]:
        set_wall(px, py)

    # ---- ruins/forest divider: broken wall with two doorways ------------------
    for y in range(1, MAP_H - 1):
        if y not in (12, 13, 28, 29):
            set_wall(24, y)

    # ---- forest: tree clusters, avoiding carved paths --------------------------
    def near(x, y, spots, r=2):
        return any(abs(x - sx) <= r and abs(y - sy) <= r for sx, sy in spots)

    keep_clear = [(38, 30), (30, 12), (36, 26), (40, 16)]  # chest + spawns
    for _ in range(60):
        cx = rng.randrange(FOREST_X[0] + 2, FOREST_X[1] - 2)
        cy = rng.randrange(2, MAP_H - 3)
        if cy in PATH_ROWS or cx in PATH_COLS or near(cx, cy, keep_clear):
            continue
        for dx in (0, 1):
            for dy in (0, 1):
                tx, ty = cx + dx, cy + dy
                if ty not in PATH_ROWS and tx not in PATH_COLS:
                    set_tree(tx, ty)

    # ---- forest/hollow divider: tree line with one gap --------------------------
    for y in range(1, MAP_H - 1):
        if y not in (19, 20, 21):
            set_tree(44, y)

    # ---- hollow: sparse pillars -------------------------------------------------
    for px, py in [(49, 10), (50, 10), (53, 30), (54, 30), (56, 12)]:
        set_wall(px, py)

    # ---- objects ------------------------------------------------------------------
    def pt(oid, name, tx, ty):
        return {
            "id": oid, "name": name, "type": "spawn",
            "x": tx * TILE + TILE // 2, "y": ty * TILE + TILE // 2,
            "width": 0, "height": 0, "point": True,
            "rotation": 0, "visible": True,
        }

    spawn_objs = [
        pt(1, "player", 4, 20),
        # ghouls: 2 in ruins, 3 in forest
        pt(2, "ghoul", 13, 10), pt(3, "ghoul", 18, 28),
        pt(4, "ghoul", 30, 12), pt(5, "ghoul", 36, 26), pt(6, "ghoul", 40, 16),
        # wraiths haunt the hollow
        pt(7, "wraith", 50, 14), pt(8, "wraith", 52, 26),
        # chests: guarded ruin interior, forest clearing, hollow climax
        pt(9, "chest", 12, 8), pt(10, "chest", 38, 30), pt(11, "chest", 56, 20),
        # braziers: ruin heart, ruins/forest doorway, hollow entrance
        pt(12, "light", 12, 12), pt(13, "light", 24, 12), pt(14, "light", 46, 20),
    ]

    # Carve every object cell clear — a spawn inside a wall is a data bug.
    for o in spawn_objs:
        walls[idx(int(o["x"] // TILE), int(o["y"] // TILE))] = 0

    def zone_rect(oid, name, x0, x1):
        return {
            "id": oid, "name": name, "type": "zone",
            "x": x0 * TILE, "y": 0,
            "width": (x1 - x0) * TILE, "height": MAP_H * TILE,
            "rotation": 0, "visible": True, "point": False,
        }

    tiled_map = {
        "type": "map",
        "version": "1.10",
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "infinite": False,
        "width": MAP_W,
        "height": MAP_H,
        "tilewidth": TILE,
        "tileheight": TILE,
        "nextlayerid": 5,
        "nextobjectid": 18,
        "layers": [
            {
                "id": 1, "type": "tilelayer", "name": "ground",
                "width": MAP_W, "height": MAP_H, "x": 0, "y": 0,
                "opacity": 1, "visible": True, "data": ground,
            },
            {
                "id": 2, "type": "tilelayer", "name": "walls",
                "width": MAP_W, "height": MAP_H, "x": 0, "y": 0,
                "opacity": 1, "visible": True, "data": walls,
            },
            {
                "id": 3, "type": "objectgroup", "name": "spawns",
                "x": 0, "y": 0, "opacity": 1, "visible": True,
                "objects": spawn_objs,
            },
            {
                "id": 4, "type": "objectgroup", "name": "zones",
                "x": 0, "y": 0, "opacity": 1, "visible": True,
                "objects": [
                    zone_rect(15, "ruins", *RUINS_X),
                    zone_rect(16, "forest", *FOREST_X),
                    zone_rect(17, "hollow", *HOLLOW_X),
                ],
            },
        ],
        "tilesets": [
            {
                "firstgid": 1,
                "name": "tiles",
                "tilewidth": TILE,
                "tileheight": TILE,
                "tilecount": 8,
                "columns": 8,
                "margin": 0,
                "spacing": 0,
                "image": "../sprites/world/tileset_placeholder.png",
                "imagewidth": TILE * 8,
                "imageheight": TILE,
            }
        ],
    }

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(tiled_map))


if __name__ == "__main__":
    build_tileset(ROOT / "public/assets/sprites/world/tileset_placeholder.png")
    build_map(ROOT / "public/assets/data/map_hollowmere.json")
    print("placeholder assets written.")
