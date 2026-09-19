# 2.5D / 3D-ish Architectural Plan (MAYBE IN FUTURE)

> **IMPORTANT DISCLAIMER**:
> This document is **strictly a hypothetical blueprint for potential future consideration ("MAYBE IN FUTURE")**.
> **DO NOT** implement, execute, refactor, or introduce any 3D/2.5D code, dependencies, or breaking changes based on this document unless explicitly requested by the user. The primary production engine remains a high-performance, turn-based 2D roguelike engine.

---

## 🧭 Vision & Architectural Goal

If ever pursued in the future, the selected direction is **2.5D Isometric / Dimetric Projection** (reminiscent of *Final Fantasy Tactics*, *Tactics Ogre*, and *Disgaea*).

This approach preserves the existing 2D HTML5 `<canvas>` rendering pipeline, fast turn ticks, pixel-art sprite atlases, and lightweight architecture without requiring heavy 3D GPU frameworks (e.g. Three.js or Babylon.js), while unlocking real tactical verticality, terraced terrain, cliffs, ramps, and elevated combat.

---

## 🗺️ Phased Transition Roadmap (For Future Reference Only)

### Phase 1: Coordinate Projection & Mathematical Foundation
- **Isometric Math Utility (`src/canvas/isoMath.ts`)**:
  - Implement 2:1 dimetric projection formulas:
    $$\text{screenX} = (x - y) \cdot \text{halfTileWidth} + \text{cameraOffsetX}$$
    $$\text{screenY} = (x + y) \cdot \text{halfTileHeight} - (z \cdot \text{elevationStep}) + \text{cameraOffsetY}$$
  - Implement reverse projection ($\text{screenX}, \text{screenY} \to \text{worldX}, \text{worldY}$) for accurate mouse picking, touch taps, and inspect cursors.
- **Painter's Algorithm & Draw Order**:
  - Replace row-by-row rendering with composite depth-sorting:
    $$\text{Depth} = (x + y) \cdot 1000 + z$$
  - Ensures elevated entities and cliff foregrounds properly occlude background elements.

---

### Phase 2: Data Model & Heightmap Layer
- **Chunk Elevation Grid (`src/types/map.ts`)**:
  - Add optional `elevation: number[][]` to map chunks:
    - $Z=0$: Waterways, trenches, subterranean pits
    - $Z=1$: Standard plains, dirt roads, forest floor
    - $Z=2$: Hills, low battlements, building foundations
    - $Z=3$: High fortress walls, watchtower platforms, cliff peaks
- **Ramp & Slope Metadata**:
  - Introduce transition tiles (e.g., `TileType.RampNorth`, `TileType.StairsEast`) connecting elevation $Z \leftrightarrow Z+1$.
- **Actor Coordinates (`src/types/entities.ts`)**:
  - Extend actors to track vertical coordinate `z: number` alongside `(x, y)`.

---

### Phase 3: Terrain Rendering & Vertical Cliff Faces
- **Terrace Block Slicing (`src/canvas/tileMapRenderer.ts`)**:
  - When rendering a tile at $Z > 0$, check adjacent southern/eastern neighbors.
  - If $Z_{\text{neighbor}} < Z$, draw vertical cliff/wall faces dropping down to match height differences.
- **Occlusion & Cutaway Transparency**:
  - Automatically apply dithered or alpha cutaway masks around entities standing behind high foreground walls ($Z \ge 3$) to prevent visual obscuration.

---

### Phase 4: Pathfinding, Movement & Traversal
- **Elevation-Aware Traversal**:
  - Normal movement allowed when $|\Delta Z| = 0$.
  - Stairs/ramps allow $|\Delta Z| = 1$.
  - Stepping down cliffs ($\Delta Z < 0$): dropping 1 level is safe; dropping $\ge 2$ levels inflicts falling damage or requires levitation/feather-fall.
- **AI Graph Search**:
  - Incorporate elevation cost into BFS/A* pathfinders, guiding enemies to naturally funnel through staircases and ramps.

---

### Phase 5: Tactical Combat & Line of Sight
- **High-Ground Combat Modifiers**:
  - High to low ground ($Z_{\text{attacker}} > Z_{\text{target}}$): $+15\%$ critical strike chance, $+1$ to $+2$ range bonus for bows/spells.
  - Low to high ground ($Z_{\text{attacker}} < Z_{\text{target}}$): range penalty and accuracy reduction.
- **3D Line-of-Sight (LOS)**:
  - Raymarching accounts for wall height: barriers only block vision if $Z_{\text{wall}} \ge \max(Z_{\text{attacker}}, Z_{\text{target}})$. Watchtower archers can shoot over low fences and bushes.

---

### Phase 6: Visual Polish (Shadows, Billboarding & Projectiles)
- **Isometric Shadows (`src/canvas/shadowRenderer.ts`)**:
  - Project directional shadows downward and across cliff drops.
- **Ballistic Parabolic Curves**:
  - Arrows and spells arc in 3D $(x, y, z)$ space over obstacles toward target elevations.
- **Smooth 3D Camera Tracking**:
  - Camera glides vertically and horizontally to follow the player's elevation adjustments.

---

## 📌 Summary of Advantages
1. **100% Logic Preservation**: Turn order, inventory, crafting, storyteller AI, audio synthesis, and JSON catalogs remain untouched.
2. **Zero Heavy Engine Bloat**: Retains native HTML5 2D canvas execution without WebGL dependencies or framework overhead.
3. **Safe & Non-Breaking**: Can remain purely as a reference design document until actively needed.
