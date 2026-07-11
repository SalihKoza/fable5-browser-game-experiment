#!/usr/bin/env python3
"""
Placeholder asset generator (ARCHITECTURE.md §10: placeholder-first pipeline).

Deterministically generates:
  - public/assets/sprites/world/tileset_placeholder.png  (4 tiles, 16x16)
  - public/assets/data/map_hollowmere.json               (Tiled-format map)

Tile IDs (firstgid=1):  1 floor · 2 floor cracked · 3 wall · 4 wall mossy
The outputs are committed; re-run only when changing the layout. When real art
arrives, only the PNG (and eventually a real Tiled file) get replaced — code
never changes.

Usage: python3 tools/generate_placeholder_assets.py   (from repo root)
"""

import json
import random
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
TILE = 16
MAP_W, MAP_H = 40, 23  # 640x368 px — larger than the 480x270 viewport, so the camera moves
SEED = 1105  # deterministic output


def build_tileset(path: Path) -> None:
    img = Image.new("RGBA", (TILE * 4, TILE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rng = random.Random(SEED)

    def speckle(x0, base, n, jitter):
        for _ in range(n):
            px = x0 + rng.randrange(1, TILE - 1)
            py = rng.randrange(1, TILE - 1)
            c = tuple(max(0, v + rng.randint(-jitter, jitter)) for v in base)
            d.point((px, py), fill=(*c, 255))

    # 1: floor — near-black stone
    d.rectangle([0, 0, TILE - 1, TILE - 1], fill=(26, 26, 34, 255))
    speckle(0, (26, 26, 34), 14, 6)
    # 2: floor cracked
    d.rectangle([TILE, 0, 2 * TILE - 1, TILE - 1], fill=(23, 23, 31, 255))
    d.line([TILE + 3, 4, TILE + 9, 11], fill=(14, 14, 20, 255))
    d.line([TILE + 9, 11, TILE + 13, 13], fill=(14, 14, 20, 255))
    # 3: wall — raised stone block with top highlight
    x0 = 2 * TILE
    d.rectangle([x0, 0, x0 + TILE - 1, TILE - 1], fill=(58, 58, 72, 255))
    d.rectangle([x0, 0, x0 + TILE - 1, 3], fill=(74, 74, 90, 255))
    d.rectangle([x0, TILE - 3, x0 + TILE - 1, TILE - 1], fill=(38, 38, 50, 255))
    speckle(x0, (58, 58, 72), 10, 8)
    # 4: wall mossy (ruins flavor)
    x0 = 3 * TILE
    d.rectangle([x0, 0, x0 + TILE - 1, TILE - 1], fill=(54, 60, 62, 255))
    d.rectangle([x0, 0, x0 + TILE - 1, 3], fill=(70, 78, 74, 255))
    speckle(x0, (60, 84, 58), 12, 10)

    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def build_map(path: Path) -> None:
    rng = random.Random(SEED)
    ground = [0] * (MAP_W * MAP_H)
    walls = [0] * (MAP_W * MAP_H)

    def set_wall(x, y):
        if 0 <= x < MAP_W and 0 <= y < MAP_H:
            walls[y * MAP_W + x] = 4 if rng.random() < 0.3 else 3

    for y in range(MAP_H):
        for x in range(MAP_W):
            ground[y * MAP_W + x] = 2 if rng.random() < 0.12 else 1

    # Border walls
    for x in range(MAP_W):
        set_wall(x, 0)
        set_wall(x, MAP_H - 1)
    for y in range(MAP_H):
        set_wall(0, y)
        set_wall(MAP_W - 1, y)

    # Ruined structure: broken rectangle with a gap (the "ruins" read)
    for x in range(8, 17):
        if x not in (12, 13):
            set_wall(x, 5)
    for y in range(5, 12):
        if y != 8:
            set_wall(8, y)
    for x in range(8, 15):
        set_wall(x, 11)

    # Long broken wall dividing the map, two gaps
    for y in range(3, 20):
        if y not in (9, 10, 16):
            set_wall(24, y)

    # Scattered pillars (2x1 clusters read better than single tiles)
    for px, py in [(30, 6), (33, 9), (29, 14), (34, 16), (18, 16), (14, 18), (5, 15)]:
        set_wall(px, py)
        set_wall(px + 1, py)

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
        "nextlayerid": 4,
        "nextobjectid": 2,
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
                "objects": [
                    {
                        "id": 1, "name": "player", "type": "spawn",
                        "x": 5 * TILE, "y": 8 * TILE,
                        "width": 0, "height": 0, "point": True,
                        "rotation": 0, "visible": True,
                    }
                ],
            },
        ],
        "tilesets": [
            {
                "firstgid": 1,
                "name": "tiles",
                "tilewidth": TILE,
                "tileheight": TILE,
                "tilecount": 4,
                "columns": 4,
                "margin": 0,
                "spacing": 0,
                "image": "../sprites/world/tileset_placeholder.png",
                "imagewidth": TILE * 4,
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
