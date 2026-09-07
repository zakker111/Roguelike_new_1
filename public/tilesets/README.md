# Sunder Roguelike — Tilesets & Animation Atlases Documentation

## 🎨 Where Does the Tileset Come From?

In Sunder, the 2D visual rendering engine uses a **hybrid dual-pipeline architecture**:

1. **Procedural In-Memory HD Synthesizer (`src/canvas/MockupAtlasGenerator.ts`)**:
   - By default at startup, `MockupAtlasGenerator` procedurally synthesizes 4 distinct 32×32 pixel-art atlases on offscreen HTML5 canvases:
     - `main_tileset`: 16×16 grid of terrain, stone masonry walls, autotiling Wang-adjacent edges, roads, water specular ripples, foliage, and props.
     - `entity_tileset`: Animated player character classes (Knight, Rogue, Mage), Town Guards, Companions (Legendary Cat), and Monsters (Goblins, Skeletons, Orcs, Rats, Spiders, Slimes).
     - `animations_tileset`: 4-frame animation strips (Frame 0: Idle, Frame 1: Walk Step Left, Frame 2: Walk Step Right, Frame 3: Attack Slash/Lunge) for fluid entity motion.
     - `boss_tileset`: Colossal multi-tile bosses (64×64 Fire Dragon, 64×64 Stone Golem, 96×96 Demon Lord Behemoth).
     - `items_tileset`: Equippable weapon sprites, staves, shields, colored potions, scrolls, catalysts, and gems.
   - It supports 4 real-time palette themes switchable in the God Mode "Tilesets & Atlases" tab:
     - **Classic Fantasy** (warm earthen stone, steel armor, verdant glades)
     - **Cyber Synthwave** (neon cyan gridlines, magenta energy, holo-circuits)
     - **Verdant Deepwood** (mossy canopy, ancient pines, emerald accents)
     - **Infernal Brimstone** (volcanic basalt, molten lava, hellfire embers)
   - These in-memory canvases are automatically registered into `src/canvas/AssetPreloader.ts`.

2. **Static Standalone PNG Mockups (`/public/tilesets/*.png`)**:
   - Genuine, pre-rendered `.png` files are provided directly in `/public/tilesets/`:
     - `main_tileset.png`: 512×512 terrain & world structure atlas
     - `entity_tileset.png`: 512×512 actors & monsters atlas
     - `animations_tileset.png`: 512×512 multi-frame walk & attack animation atlas
     - `boss_tileset.png`: 512×512 colossal multi-tile boss atlas
     - `items_tileset.png`: 512×512 inventory items & equipment icons
   - These PNG files can be edited in Aseprite, Photoshop, GIMP, or any pixel-art editor.
   - Developers and modders can place replacement PNGs into `/public/tilesets/` to hot-swap graphics without code changes.

---

## 📐 Atlas Coordinate Layout (16×16 Grid, 32×32 Pixels)

### 1. Main Tileset (`main_tileset.png`)
- **Rows 0–3**: Autotiled Terrain & Surfaces
  - `Cols 0–3`: Stone Masonry Walls (16-bitmask Wang corners, edges, pillars, and intersections)
  - `Cols 4–7`: Water & River tiles with wave crests and specular ripple glints
  - `Cols 8–11`: Cobblestone Paths, Flagstone, and Highway Trails
  - `Cols 12–15`: Natural Grass Variants (lush plain, single tuft, double tuft, wild weed)
- **Rows 4–5**: Secondary Terrain & Flooring Extensions
- **Row 6**: Foliage & Mineral Veins
  - `(0, 6)`: Oak Tree (Canopy & rooted trunk)
  - `(1, 6)`: Pine Tree (Tiered conifer boughs)
  - `(2, 6)`: Birch Tree (White notched bark)
  - `(3, 6)`: Sweet Berry Bush (Lush leaves with red berries)
  - `(4, 6)`: Copper Ore Mineral Vein (Slate rock with bronze crystal clusters)
  - `(5, 6)`: Iron Ore Mineral Vein (Faceted slate with silver-steel crystal clusters)
- **Row 8**: Interactive Entrances, Stairs, Chests, Shrines & Props
  - `(0, 8)`: Wooden Door Closed (Static single-frame timber with iron latch)
  - `(1, 8)`: Wooden Door Open (Stone doorway threshold)
  - `(2, 8)`: Stairs Down (Subterranean descent)
  - `(3, 8)`: Stairs Up (Surface ascent)
  - `(4, 8)`: Wooden Treasure Chest
  - `(5, 8)`: Iron Chest
  - `(6, 8)`: Gilded / Ornate Chest
  - `(7, 8)`: Mimic Chest (Subtle fangs)
  - `(8, 8)`: Ancient Vitality Shrine (Cyan crystal fountain)
  - `(9, 8)`: Arcane Ley Shrine (Amethyst monolith)
  - `(10, 8)`: Wrath Shrine (Crimson obelisk)
  - `(11, 8)`: Fortune Shrine (Gold basin)
  - `(12, 8)`: Signpost (Wooden crossroads marker)
  - `(13, 8)`: Campfire (Lit stone pit with flames)
  - `(14, 8)`: Covered Merchant Wagon
- **Row 9**: Dungeon Traps & Hazard Pools
  - `(0, 9)`: Spike Vent Floor Trap
  - `(1, 9)`: Fire Vent Floor Trap
  - `(2, 9)`: Poison Gas Vent Trap
  - `(3, 9)`: Frostbite Vent Trap
  - `(4, 9)`: Magma / Lava Hazard Pool
  - `(5, 9)`: Glacial Frost Rime / Ice Hazard Pool
  - `(6, 9)`: Desert Quicksand Pool

### 2. Animations Tileset (`animations_tileset.png`)
- **Row 0**: Player Knight — `(0,0)` Idle, `(1,0)` Walk-1, `(2,0)` Walk-2, `(3,0)` Attack Slash
- **Row 1**: Shadow Rogue — `(0,1)` Idle, `(1,1)` Walk-1, `(2,1)` Walk-2, `(3,1)` Attack Stab
- **Row 2**: Arcane Mage — `(0,2)` Idle, `(1,2)` Walk-1, `(2,2)` Walk-2, `(3,2)` Spell Cast
- **Row 3**: Town Guard — `(0,3)` Idle, `(1,3)` Walk-1, `(2,3)` Walk-2, `(3,3)` Shield Bash
- **Row 4**: Companion Cat — `(0,4)` Idle Paws, `(1,4)` Walk Trot, `(2,4)` Walk Step, `(3,4)` Pounce
- **Row 5**: Goblin Scout — `(0,5)` Idle, `(1,5)` Walk-1, `(2,5)` Walk-2, `(3,5)` Spear Thrust
- **Row 6**: Skeleton Warrior — `(0,6)` Idle, `(1,6)` Walk-1, `(2,6)` Walk-2, `(3,6)` Bone Cleave

---

## 🔄 Dual Instinct Sourcing (`classic_png` vs `classic_code`)
The game engine provides dual authoritative sources for the Classic tileset:
- **Instinct Classic (PNG Mockups)**: Pre-rendered static `.png` sprite sheets from `/public/tilesets/`.
- **Instinct Classic (Procedural Code)**: Live programmatic HTML5 canvas renderer generated in memory by `MockupAtlasGenerator.ts`.
Toggle between them at runtime inside **Tileset Studio** (`F1` or God Mode button -> **Tileset Studio**). Preferences are persisted in `localStorage`.

---

## 🛠️ How to Generate or Rebuild Tilesets
Run the automated PNG generator script from the project root:
```bash
node scripts/generateMockupPngs.cjs
```
This instantly re-renders all 5 PNG atlases with crisp pixel-art geometry and transparent backgrounds.

Alternatively, navigate to the **God Mode > Tileset Tester** panel in-game to adjust themes, scale sprite sizes (16–64px), preview live walk/attack animations, and click **Download Atlas PNG** to export your custom configurations!
