# Sunder Roguelike — Tileset & Animation Engineering Architecture

## Overview

The graphics system in Sunder provides both **Classic High-DPI Procedural Glyph (ASCII)** mode and **Animated HD Tileset** mode. The game defaults cleanly to ASCII mode on startup while allowing instant runtime hot-swapping via the top header bar button (`🎨 Tileset`) or shortcut keys (`F8` / `Alt+T`).

### 1. Dual Sourcing Architecture (`classic_png` vs `classic_code`)
In animated tileset mode, the engine supports two distinct authoritative pipelines:
- **Instinct Classic (PNG Mockups)**: Pre-rendered static `.png` sprite sheets loaded from `/public/tilesets/`.
- **Instinct Classic (Procedural Code)**: Dynamic programmatic HTML5 canvas renderer generated at runtime in memory by `MockupAtlasGenerator.ts`.
- **Seamless Hot-Swapping**: Players and developers can toggle between sources at any time in **Tileset Studio** (`F1` -> Tileset Studio tab). The selected source is persisted in `localStorage` under `abyss_rogue_tileset_source`.

### 2. Standalone PNG Mockups (`/public/tilesets/`)
- `main_tileset.png`: 512×512 terrain, walls, autotiled Wang corners, water, roads, foliage, stairs, doors, chests, shrines, and traps.
- `entity_tileset.png`: 512×512 base character, companion, guard, and monster sprites.
- `animations_tileset.png`: 512×512 4-frame animation strips (Idle, Walk-1, Walk-2, Attack) for smooth character and beast movement.
- `boss_tileset.png`: 512×512 oversized 64×64 and 96×96 multi-tile bosses (IgnisWyrm, FrostfangTitan, Kraken, Behemoths).
- `items_tileset.png`: 512×512 equipment icons, weapons, armor paperdoll pieces, and potions.

### 3. Synchronized 16×16 Grid Coordinate Mapping (`TilesetAtlasManager.ts`)
- **Rows 0–3**: Autotiled Terrain & Surfaces
  - `Cols 0–3`: Stone Walls (16-bitmask Wang corners, edges, pillars, intersections)
  - `Cols 4–7`: Water & Rivers (autotiled ripples with foam and specular glints)
  - `Cols 8–11`: Cobblestone & Dirt Highway Paths (autotiled roads)
  - `Cols 12–15`: Natural Grass variants
- **Row 6**: Foliage & Mining Veins
  - `Col 0`: Oak Tree (leafy canopy & rooted trunk)
  - `Col 1`: Pine Tree (sharp tiered conifer boughs)
  - `Col 2`: Birch Tree (white notched bark)
  - `Col 3`: Sweet Berry Bush (red berries)
  - `Col 4`: Copper Ore Vein (slate rock with bronze crystal clusters)
  - `Col 5`: Iron Ore Vein (faceted rock with silver-steel crystal clusters)
- **Row 8**: Interactive Entrances, Props, Chests & Shrines
  - `Col 0`: Wooden Door Closed (static single-frame timber with iron latch)
  - `Col 1`: Wooden Door Open (stone doorway threshold)
  - `Col 2`: Stairs Down (dungeon descent)
  - `Col 3`: Stairs Up (surface ascent)
  - `Cols 4–7`: Chests (Wooden, Iron, Gilded, Mimic)
  - `Cols 8–11`: Shrines (Vitality, Arcane Ley, Wrath, Fortune)
  - `Cols 12–14`: Props (Crossroads Signpost, Campfire, Covered Wagon)
- **Row 9**: Dungeon Traps & Hazard Pools
  - `Cols 0–3`: Traps (Spike Vent, Fire Vent, Poison Gas Vent, Frostbite Vent)
  - `Cols 4–6`: Hazards (Magma/Lava pool, Glacial Frost Rime, Quicksand)

### 4. Authoring Custom PNG Tilesets by Hand
1. Open any pixel-art editor (Aseprite, Photoshop, Piskel, GIMP).
2. Create a new image of size **512×512 px** with a transparent background.
3. Configure a **32×32 px grid** (yielding a 16×16 tile atlas).
4. Save the file directly into `/public/tilesets/<atlas_name>.png`.
5. Launch the game, open **God Mode > Tileset Studio** (`F1`), and inspect the live grid alignment.

### 5. Automated PNG Regeneration Script
To re-synthesize all standalone `.png` mockups from terminal anytime:
```bash
npm run generate:tilesets
# or: node scripts/generateMockupPngs.cjs
```
