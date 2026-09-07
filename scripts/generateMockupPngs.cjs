/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Generates genuine, standalone PNG mockup tileset files into /public/tilesets/
 * using Node.js built-in zlib.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk: width(4), height(4), bitDepth(1), colorType(1)=6(RGBA), comp(1), filter(1), interlace(1)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0 (None)
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: None
    const srcOffset = y * width * 4;
    rgbaBuffer.copy(rawData, rowOffset + 1, srcOffset, srcOffset + width * 4);
  }

  const compressedData = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', compressedData);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Pixel drawing helpers
function setPixel(buf, width, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0) return;
  const idx = (y * width + x) * 4;
  if (idx < 0 || idx + 3 >= buf.length) return;
  buf[idx] = r;
  buf[idx + 1] = g;
  buf[idx + 2] = b;
  buf[idx + 3] = a;
}

function fillRect(buf, width, startX, startY, w, h, r, g, b, a = 255) {
  for (let y = startY; y < startY + h; y++) {
    for (let x = startX; x < startX + w; x++) {
      setPixel(buf, width, x, y, r, g, b, a);
    }
  }
}

// Color palette
const C = {
  void: [10, 15, 30],
  stoneDark: [45, 52, 65],
  stoneMid: [75, 85, 105],
  stoneLight: [120, 135, 160],
  stoneHighlight: [170, 185, 210],
  grassDark: [22, 101, 52],
  grassMid: [34, 197, 94],
  grassLight: [74, 222, 128],
  waterDark: [14, 116, 144],
  waterMid: [6, 182, 212],
  waterGlint: [165, 243, 252],
  woodDark: [113, 63, 18],
  woodMid: [180, 83, 9],
  woodLight: [217, 119, 6],
  gold: [234, 179, 8],
  goldLight: [253, 224, 71],
  skin: [251, 191, 36],
  skinShadow: [217, 119, 6],
  steel: [148, 163, 184],
  steelLight: [226, 232, 240],
  ruby: [239, 68, 68],
  amethyst: [168, 85, 247],
  emerald: [16, 185, 129],
  clothRed: [220, 38, 38],
  clothBlue: [37, 99, 235],
  clothPurple: [147, 51, 234],
  copper: [249, 115, 22],
  iron: [148, 163, 184],
  white: [255, 255, 255],
  black: [15, 23, 42]
};

/**
 * Generates main terrain atlas (512x512, 16x16 grid of 32x32 tiles)
 * Perfectly aligned with TilesetAtlasManager.ts:
 * - Rows 0..3:
 *   - Cols 0..3: 16 Wall Autotiles (Bitmasks 0..15: bitmask = row * 4 + col)
 *   - Cols 4..7: 16 Water Autotiles (Bitmasks 0..15: bitmask = row * 4 + (col - 4))
 *   - Cols 8..11: 16 Path Autotiles (Bitmasks 0..15: bitmask = row * 4 + (col - 8))
 *   - Cols 12..15:
 *     - Row 0: Floor (col 12), Grass (col 13), Sand (col 14), Snow (col 15)
 *     - Row 1: Lava (col 12), Door Closed (col 13), Door Open (col 14), Sign (col 15)
 *     - Row 2: StairsDown (col 12), StairsUp (col 13), DungeonEntrance (col 14), TownGate (col 15)
 *     - Row 3: Tree (col 12), PineTree (col 13), BirchTree (col 14), Bush (col 15)
 * - Row 4 (cols 0..15):
 *   - TreeStump (0), CopperVein (1), IronVein (2), Campfire (3), Torch (4), Fireplace (5),
 *     Anvil (6), Table (7), Chair (8), Bed (9), Bedroll (10), FieldTent (11), Window (12),
 *     Chest Closed (13), Chest Opened (14), Mystic Shrine (15)
 * - Row 5 (cols 0..7):
 *   - WatchtowerWall (0), WatchtowerSlit (1), WatchtowerDeck (2), WatchtowerFlag (3),
 *     WatchtowerBarricade (4), SpikeTrap (5), FireVent (6), PoisonGasVent (7)
 * - Row 6 (cols 0..15): Additional Overworld / Harbor Props
 */
function generateMainTileset() {
  const size = 512;
  const tileSize = 32;
  const buf = Buffer.alloc(size * size * 4);

  // Background void
  fillRect(buf, size, 0, 0, size, size, ...C.void, 255);

  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      const x = col * tileSize;
      const y = row * tileSize;

      // -----------------------------------------------------------------
      // ROWS 0..3: Autotiles & Core Terrain/Props (Cols 0..15)
      // -----------------------------------------------------------------
      if (row >= 0 && row <= 3) {
        // --- COLS 0..3: 16-Bitmask Wall Autotiles ---
        if (col >= 0 && col <= 3) {
          const bitmask = row * 4 + col;
          // Base wall solid stone
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneDark);
          fillRect(buf, size, x + 1, y + 1, tileSize - 2, tileSize - 2, ...C.stoneMid);

          // Mortar lines
          fillRect(buf, size, x, y + 16, tileSize, 1, ...C.stoneDark);
          fillRect(buf, size, x + 16, y, 1, 16, ...C.stoneDark);
          fillRect(buf, size, x + 8, y + 16, 1, 16, ...C.stoneDark);
          fillRect(buf, size, x + 24, y + 16, 1, 16, ...C.stoneDark);

          // Top highlight
          fillRect(buf, size, x + 1, y + 1, tileSize - 2, 1, ...C.stoneHighlight);

          // Cardinal connectivity cues (N=1, E=2, S=4, W=8)
          if (bitmask & 1) fillRect(buf, size, x + 10, y, 12, 2, ...C.stoneHighlight);
          if (bitmask & 2) fillRect(buf, size, x + tileSize - 2, y + 10, 2, 12, ...C.stoneHighlight);
          if (bitmask & 4) fillRect(buf, size, x + 10, y + tileSize - 2, 12, 2, ...C.stoneHighlight);
          if (bitmask & 8) fillRect(buf, size, x, y + 10, 2, 12, ...C.stoneHighlight);
        }
        // --- COLS 4..7: 16-Bitmask Water Autotiles ---
        else if (col >= 4 && col <= 7) {
          const bitmask = row * 4 + (col - 4);
          // Deep calm water base
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.waterDark);

          // Horizontal surface ripple lines
          fillRect(buf, size, x + 4, y + 7, tileSize - 8, 2, ...C.waterMid);
          fillRect(buf, size, x + 8, y + 17, tileSize - 14, 2, ...C.waterMid);

          // Sun glint sparkles
          fillRect(buf, size, x + 6, y + 7, 2, 1, ...C.waterGlint);
          fillRect(buf, size, x + 16, y + 17, 2, 1, ...C.waterGlint);

          // Shoreline foam on non-connected edges (N=1, E=2, S=4, W=8)
          if (!(bitmask & 1)) fillRect(buf, size, x, y, tileSize, 2, ...C.waterGlint);
          if (!(bitmask & 2)) fillRect(buf, size, x + tileSize - 2, y, 2, tileSize, ...C.waterGlint);
          if (!(bitmask & 4)) fillRect(buf, size, x, y + tileSize - 2, tileSize, 2, ...C.waterGlint);
          if (!(bitmask & 8)) fillRect(buf, size, x, y, 2, tileSize, ...C.waterGlint);
        }
        // --- COLS 8..11: 16-Bitmask Path Autotiles ---
        else if (col >= 8 && col <= 11) {
          const bitmask = row * 4 + (col - 8);
          // Dark dirt underlay
          fillRect(buf, size, x, y, tileSize, tileSize, 28, 25, 23);

          // Cobblestone ribbon center
          fillRect(buf, size, x + 4, y + 4, tileSize - 8, tileSize - 8, 60, 50, 40);

          // Cardinal connections
          if (bitmask & 1) fillRect(buf, size, x + 6, y, tileSize - 12, 5, 60, 50, 40);
          if (bitmask & 2) fillRect(buf, size, x + tileSize - 5, y + 6, 5, tileSize - 12, 60, 50, 40);
          if (bitmask & 4) fillRect(buf, size, x + 6, y + tileSize - 5, tileSize - 12, 5, 60, 50, 40);
          if (bitmask & 8) fillRect(buf, size, x, y + 6, 5, tileSize - 12, 60, 50, 40);

          // Paving stone details
          fillRect(buf, size, x + 8, y + 8, 4, 4, 120, 110, 100);
          fillRect(buf, size, x + 18, y + 10, 5, 4, 140, 130, 120);
          fillRect(buf, size, x + 10, y + 18, 5, 5, 130, 120, 110);
          fillRect(buf, size, x + 18, y + 20, 4, 4, 110, 100, 90);
        }
        // --- COLS 12..15: Static Ground & Landmarks ---
        else if (col >= 12 && col <= 15) {
          // --- ROW 0: Ground Types ---
          if (row === 0) {
            if (col === 12) {
              // Floor: Clean stone slab
              fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneDark);
              fillRect(buf, size, x + 2, y + 2, tileSize - 4, tileSize - 4, ...C.stoneMid);
              fillRect(buf, size, x + 15, y + 15, 2, 2, ...C.stoneDark);
            } else if (col === 13) {
              // Grass: Lush green with neat blade tufts
              fillRect(buf, size, x, y, tileSize, tileSize, ...C.grassDark);
              fillRect(buf, size, x + 1, y + 1, tileSize - 2, tileSize - 2, ...C.grassMid);
              fillRect(buf, size, x + 6, y + 8, 2, 4, ...C.grassLight);
              fillRect(buf, size, x + 8, y + 10, 2, 3, ...C.grassLight);
              fillRect(buf, size, x + 20, y + 18, 2, 4, ...C.grassLight);
              fillRect(buf, size, x + 22, y + 20, 2, 3, ...C.grassLight);
            } else if (col === 14) {
              // Sand: Golden dunes
              fillRect(buf, size, x, y, tileSize, tileSize, 217, 165, 85);
              fillRect(buf, size, x + 4, y + 8, 8, 2, 180, 125, 50);
              fillRect(buf, size, x + 14, y + 18, 10, 2, 180, 125, 50);
              fillRect(buf, size, x + 22, y + 10, 6, 1, 245, 195, 120);
            } else if (col === 15) {
              // Snow: Crisp pale crystalline snow
              fillRect(buf, size, x, y, tileSize, tileSize, 210, 225, 240);
              fillRect(buf, size, x + 6, y + 12, 3, 2, 170, 195, 225);
              fillRect(buf, size, x + 18, y + 8, 3, 2, 170, 195, 225);
              fillRect(buf, size, x + 8, y + 13, 1, 1, ...C.white);
              fillRect(buf, size, x + 20, y + 9, 1, 1, ...C.white);
            }
          }
          // --- ROW 1: Portals, Doors & Signs ---
          else if (row === 1) {
            if (col === 12) {
              // Lava: Magma pool
              fillRect(buf, size, x, y, tileSize, tileSize, 120, 20, 10);
              fillRect(buf, size, x + 4, y + 8, 10, 4, 245, 100, 20);
              fillRect(buf, size, x + 16, y + 16, 12, 5, 245, 100, 20);
              fillRect(buf, size, x + 6, y + 9, 4, 2, ...C.goldLight);
              fillRect(buf, size, x + 19, y + 17, 4, 2, ...C.goldLight);
            } else if (col === 13) {
              // Wooden Door Closed
              fillRect(buf, size, x, y, tileSize, tileSize, 28, 25, 23);
              fillRect(buf, size, x + 2, y + 2, tileSize - 4, tileSize - 4, ...C.woodDark);
              fillRect(buf, size, x + 4, y + 3, 6, tileSize - 6, ...C.woodMid);
              fillRect(buf, size, x + 12, y + 3, 7, tileSize - 6, ...C.woodMid);
              fillRect(buf, size, x + 21, y + 3, 6, tileSize - 6, ...C.woodMid);
              // Iron cross-bands
              fillRect(buf, size, x + 2, y + 7, tileSize - 4, 3, 15, 23, 42);
              fillRect(buf, size, x + 2, y + tileSize - 10, tileSize - 4, 3, 15, 23, 42);
              // Brass handle
              fillRect(buf, size, x + tileSize - 8, y + 14, 4, 4, ...C.gold);
            } else if (col === 14) {
              // Wooden Door Open
              fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
              fillRect(buf, size, x, y, tileSize, 3, ...C.stoneDark);
              fillRect(buf, size, x, y, 4, tileSize, ...C.stoneDark);
              fillRect(buf, size, x + tileSize - 4, y, 4, tileSize, ...C.stoneDark);
              fillRect(buf, size, x + 8, y + 3, tileSize - 12, tileSize - 3, 10, 15, 25);
              fillRect(buf, size, x + 2, y + 3, 6, tileSize - 5, ...C.woodMid);
            } else if (col === 15) {
              // Signpost
              fillRect(buf, size, x + 14, y + 12, 4, tileSize - 14, ...C.woodDark);
              fillRect(buf, size, x + 4, y + 4, tileSize - 8, 12, ...C.woodMid);
              fillRect(buf, size, x + 7, y + 7, tileSize - 14, 2, ...C.woodDark);
              fillRect(buf, size, x + 7, y + 11, tileSize - 18, 2, ...C.woodDark);
            }
          }
          // --- ROW 2: Stairs, Gates & Dungeon Entrances ---
          else if (row === 2) {
            if (col === 12) {
              // Stairs Down
              fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
              for (let s = 0; s < 4; s++) {
                const stepY = y + 4 + s * 6;
                const shade = 70 - s * 16;
                fillRect(buf, size, x + 4, stepY, tileSize - 8, 4, shade, shade, shade + 5);
                fillRect(buf, size, x + 4, stepY, tileSize - 8, 1, ...C.gold);
              }
            } else if (col === 13) {
              // Stairs Up
              fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
              for (let s = 0; s < 4; s++) {
                const stepY = y + 22 - s * 6;
                const shade = 100 + s * 25;
                fillRect(buf, size, x + 4, stepY, tileSize - 8, 4, shade, shade, shade + 10);
                fillRect(buf, size, x + 4, stepY, tileSize - 8, 1, ...C.waterGlint);
              }
            } else if (col === 14) {
              // Dungeon Entrance: Stone archway into dark depths
              fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneDark);
              fillRect(buf, size, x + 4, y + 2, tileSize - 8, tileSize - 2, ...C.stoneMid);
              fillRect(buf, size, x + 8, y + 8, tileSize - 16, tileSize - 8, 10, 15, 25);
              fillRect(buf, size, x + 6, y + 4, tileSize - 12, 4, ...C.stoneHighlight);
            } else if (col === 15) {
              // Town Gate: Fortress portcullis
              fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneDark);
              fillRect(buf, size, x + 4, y + 4, 24, 24, 20, 20, 25);
              for (let gx = 6; gx < 28; gx += 4) {
                fillRect(buf, size, x + gx, y + 4, 2, 24, ...C.iron);
              }
            }
          }
          // --- ROW 3: Trees & Harvestables ---
          else if (row === 3) {
            if (col === 12) {
              // Tree: Majestic Oak
              fillRect(buf, size, x, y, tileSize, tileSize, ...C.grassMid);
              fillRect(buf, size, x + 13, y + 18, 6, 12, ...C.woodDark);
              fillRect(buf, size, x + 6, y + 4, 20, 16, ...C.grassDark);
              fillRect(buf, size, x + 8, y + 6, 16, 12, ...C.grassMid);
              fillRect(buf, size, x + 10, y + 8, 12, 8, ...C.grassLight);
            } else if (col === 13) {
              // Pine Tree
              fillRect(buf, size, x, y, tileSize, tileSize, ...C.grassMid);
              fillRect(buf, size, x + 14, y + 22, 4, 8, ...C.woodDark);
              fillRect(buf, size, x + 8, y + 14, 16, 8, 15, 75, 40);
              fillRect(buf, size, x + 10, y + 8, 12, 7, 20, 95, 50);
              fillRect(buf, size, x + 12, y + 2, 8, 7, 30, 125, 60);
            } else if (col === 14) {
              // Birch Tree
              fillRect(buf, size, x, y, tileSize, tileSize, ...C.grassMid);
              fillRect(buf, size, x + 14, y + 16, 4, 14, ...C.white);
              fillRect(buf, size, x + 14, y + 20, 4, 2, ...C.black);
              fillRect(buf, size, x + 8, y + 4, 16, 14, ...C.gold);
            } else if (col === 15) {
              // Berry Bush
              fillRect(buf, size, x, y, tileSize, tileSize, ...C.grassMid);
              fillRect(buf, size, x + 6, y + 6, 20, 20, ...C.grassDark);
              fillRect(buf, size, x + 8, y + 8, 16, 16, ...C.grassMid);
              fillRect(buf, size, x + 10, y + 10, 4, 4, ...C.ruby);
              fillRect(buf, size, x + 18, y + 12, 4, 4, ...C.ruby);
              fillRect(buf, size, x + 12, y + 18, 4, 4, ...C.ruby);
            }
          }
        }
      }

      // -----------------------------------------------------------------
      // ROW 4: Props, Resources & Furniture (Cols 0..15)
      // -----------------------------------------------------------------
      else if (row === 4) {
        if (col === 0) {
          // Tree Stump
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.grassMid);
          fillRect(buf, size, x + 9, y + 12, 14, 12, ...C.woodDark);
          fillRect(buf, size, x + 11, y + 14, 10, 8, ...C.woodMid);
          fillRect(buf, size, x + 15, y + 17, 2, 2, ...C.woodDark);
        } else if (col === 1) {
          // Copper Vein
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneDark);
          fillRect(buf, size, x + 4, y + 4, 24, 24, ...C.stoneMid);
          fillRect(buf, size, x + 8, y + 8, 6, 6, ...C.copper);
          fillRect(buf, size, x + 18, y + 14, 6, 6, ...C.copper);
          fillRect(buf, size, x + 10, y + 20, 5, 5, ...C.goldLight);
        } else if (col === 2) {
          // Iron Vein
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneDark);
          fillRect(buf, size, x + 4, y + 4, 24, 24, ...C.stoneMid);
          fillRect(buf, size, x + 8, y + 8, 6, 6, ...C.iron);
          fillRect(buf, size, x + 18, y + 14, 6, 6, ...C.steelLight);
          fillRect(buf, size, x + 12, y + 18, 5, 5, ...C.white);
        } else if (col === 3) {
          // Campfire
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneDark);
          fillRect(buf, size, x + 8, y + 20, 16, 6, ...C.woodDark);
          fillRect(buf, size, x + 11, y + 8, 10, 14, 245, 100, 20);
          fillRect(buf, size, x + 13, y + 12, 6, 8, ...C.goldLight);
        } else if (col === 4) {
          // Wall Torch
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 14, y + 14, 4, 14, ...C.iron);
          fillRect(buf, size, x + 12, y + 8, 8, 8, 245, 120, 20);
        } else if (col === 5) {
          // Fireplace
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneDark);
          fillRect(buf, size, x + 4, y + 4, 24, 24, ...C.stoneMid);
          fillRect(buf, size, x + 8, y + 12, 16, 16, 30, 20, 20);
          fillRect(buf, size, x + 11, y + 15, 10, 10, 240, 70, 15);
        } else if (col === 6) {
          // Anvil
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 6, y + 12, 20, 8, ...C.stoneDark);
          fillRect(buf, size, x + 10, y + 20, 12, 8, ...C.iron);
          fillRect(buf, size, x + 6, y + 12, 20, 2, ...C.steelLight);
        } else if (col === 7) {
          // Table
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 4, y + 8, 24, 12, ...C.woodMid);
          fillRect(buf, size, x + 6, y + 20, 4, 8, ...C.woodDark);
          fillRect(buf, size, x + 22, y + 20, 4, 8, ...C.woodDark);
        } else if (col === 8) {
          // Chair
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 8, y + 14, 16, 6, ...C.woodMid);
          fillRect(buf, size, x + 8, y + 6, 4, 12, ...C.woodDark);
          fillRect(buf, size, x + 10, y + 20, 4, 8, ...C.woodDark);
        } else if (col === 9) {
          // Bed
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 6, y + 4, 20, 24, ...C.woodDark);
          fillRect(buf, size, x + 8, y + 6, 16, 8, ...C.white);
          fillRect(buf, size, x + 8, y + 14, 16, 12, ...C.clothBlue);
        } else if (col === 10) {
          // Bedroll
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.grassMid);
          fillRect(buf, size, x + 8, y + 8, 16, 18, 120, 80, 40);
          fillRect(buf, size, x + 10, y + 8, 12, 6, 200, 180, 150);
        } else if (col === 11) {
          // Field Tent
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.grassMid);
          fillRect(buf, size, x + 4, y + 8, 24, 18, 200, 180, 140);
          fillRect(buf, size, x + 13, y + 14, 6, 12, 40, 30, 20);
        } else if (col === 12) {
          // Window
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 6, y + 6, 20, 20, ...C.woodDark);
          fillRect(buf, size, x + 8, y + 8, 16, 16, 245, 215, 110);
          fillRect(buf, size, x + 15, y + 8, 2, 16, ...C.woodDark);
          fillRect(buf, size, x + 8, y + 15, 16, 2, ...C.woodDark);
        } else if (col === 13) {
          // Closed Chest
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 6, y + 10, 20, 16, ...C.woodDark);
          fillRect(buf, size, x + 8, y + 12, 16, 12, ...C.woodMid);
          fillRect(buf, size, x + 6, y + 8, 20, 4, ...C.woodLight);
          fillRect(buf, size, x + 14, y + 16, 4, 4, ...C.gold);
        } else if (col === 14) {
          // Opened Chest
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 6, y + 14, 20, 14, ...C.woodDark);
          fillRect(buf, size, x + 8, y + 16, 16, 10, ...C.woodMid);
          fillRect(buf, size, x + 6, y + 6, 20, 7, ...C.woodLight);
          fillRect(buf, size, x + 10, y + 16, 12, 6, ...C.gold);
        } else if (col === 15) {
          // Mystic Shrine / Monolith
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneDark);
          fillRect(buf, size, x + 8, y + 6, 16, 22, ...C.stoneDark);
          fillRect(buf, size, x + 10, y + 8, 12, 18, ...C.gold);
          fillRect(buf, size, x + 13, y + 12, 6, 8, ...C.goldLight);
        }
      }

      // -----------------------------------------------------------------
      // ROW 5: Fortifications & Traps (Cols 0..7)
      // -----------------------------------------------------------------
      else if (row === 5) {
        if (col === 0) {
          // Watchtower Stone Wall
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneDark);
          fillRect(buf, size, x + 2, y + 2, tileSize - 4, tileSize - 4, ...C.steel);
          fillRect(buf, size, x + 4, y + 4, tileSize - 8, 4, ...C.stoneHighlight);
        } else if (col === 1) {
          // Watchtower Arrow Slit
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneDark);
          fillRect(buf, size, x + 14, y + 6, 4, 20, 10, 10, 15);
        } else if (col === 2) {
          // Watchtower Deck
          fillRect(buf, size, x, y, tileSize, tileSize, 50, 25, 10);
          fillRect(buf, size, x + 2, y + 2, tileSize - 4, tileSize - 4, ...C.woodMid);
          for (let by = 4; by < tileSize - 4; by += 6) {
            fillRect(buf, size, x + 2, y + by, tileSize - 4, 1, ...C.woodDark);
          }
        } else if (col === 3) {
          // Watchtower Flag
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 6, y + 4, 2, 24, ...C.woodDark);
          fillRect(buf, size, x + 8, y + 6, 16, 10, ...C.clothBlue);
          fillRect(buf, size, x + 12, y + 9, 8, 4, ...C.gold);
        } else if (col === 4) {
          // Watchtower Wooden Barricade
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.grassMid);
          fillRect(buf, size, x + 4, y + 10, 24, 14, ...C.woodDark);
          fillRect(buf, size, x + 6, y + 8, 4, 18, ...C.woodLight);
          fillRect(buf, size, x + 14, y + 6, 4, 20, ...C.woodLight);
          fillRect(buf, size, x + 22, y + 8, 4, 18, ...C.woodLight);
        } else if (col === 5) {
          // Spike Trap
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          for (let s = 0; s < 3; s++) {
            fillRect(buf, size, x + 6 + s * 8, y + 8, 4, 14, ...C.steelLight);
            fillRect(buf, size, x + 7 + s * 8, y + 6, 2, 4, ...C.white);
          }
        } else if (col === 6) {
          // Fire Vent
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 8, y + 8, 16, 16, 30, 20, 20);
          fillRect(buf, size, x + 11, y + 11, 10, 10, 240, 70, 15);
        } else if (col === 7) {
          // Poison Gas Vent
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 8, y + 8, 16, 16, 20, 40, 20);
          fillRect(buf, size, x + 10, y + 10, 12, 12, 34, 197, 94);
        }
      }

      // -----------------------------------------------------------------
      // ROW 6: Additional Overworld, Water & Town Props (Cols 0..15)
      // -----------------------------------------------------------------
      else if (row === 6) {
        if (col === 0) {
          // Merchant Caravan Covered Wagon
          fillRect(buf, size, x, y, tileSize, tileSize, 50, 45, 40);
          fillRect(buf, size, x + 4, y + 14, 24, 12, ...C.woodDark);
          fillRect(buf, size, x + 6, y + 6, 20, 10, 230, 220, 200);
          fillRect(buf, size, x + 6, y + 22, 6, 6, ...C.iron);
          fillRect(buf, size, x + 20, y + 22, 6, 6, ...C.iron);
        } else if (col === 1) {
          // Wooden Bridge Horizontal
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.waterDark);
          fillRect(buf, size, x, y + 6, tileSize, 20, ...C.woodMid);
          for (let bx = 0; bx < tileSize; bx += 6) {
            fillRect(buf, size, x + bx, y + 6, 1, 20, ...C.woodDark);
          }
        } else if (col === 2) {
          // Wooden Bridge Vertical
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.waterDark);
          fillRect(buf, size, x + 6, y, 20, tileSize, ...C.woodMid);
          for (let by = 0; by < tileSize; by += 6) {
            fillRect(buf, size, x + 6, y + by, 20, 1, ...C.woodDark);
          }
        } else if (col === 3) {
          // Blighted Swamp Tree
          fillRect(buf, size, x, y, tileSize, tileSize, 40, 50, 40);
          fillRect(buf, size, x + 13, y + 10, 6, 20, 35, 30, 30);
          fillRect(buf, size, x + 7, y + 6, 8, 6, 45, 35, 35);
          fillRect(buf, size, x + 17, y + 4, 8, 6, 45, 35, 35);
        } else if (col === 4) {
          // Deep Ocean Water
          fillRect(buf, size, x, y, tileSize, tileSize, 8, 50, 80);
          fillRect(buf, size, x + 4, y + 12, 24, 2, ...C.waterDark);
        } else if (col === 5) {
          // Swampland Mud
          fillRect(buf, size, x, y, tileSize, tileSize, 55, 65, 45);
          fillRect(buf, size, x + 6, y + 14, 12, 6, 35, 45, 30);
        } else if (col === 6) {
          // Cobblestone Town Plaza
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          for (let py = 2; py < tileSize; py += 6) {
            for (let px = 2; px < tileSize; px += 6) {
              fillRect(buf, size, x + px, y + py, 4, 4, ...C.stoneLight);
            }
          }
        } else if (col === 7) {
          // Harbor Pier Planks
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.waterDark);
          fillRect(buf, size, x + 4, y, 24, tileSize, ...C.woodMid);
          for (let wy = 0; wy < tileSize; wy += 4) {
            fillRect(buf, size, x + 4, y + wy, 24, 1, ...C.woodDark);
          }
        } else if (col === 8) {
          // Harbor Crane / Mast
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.waterDark);
          fillRect(buf, size, x + 14, y + 2, 4, 28, ...C.woodDark);
          fillRect(buf, size, x + 6, y + 6, 20, 3, ...C.woodMid);
        } else if (col === 9) {
          // Village Well
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 8, y + 10, 16, 14, ...C.stoneDark);
          fillRect(buf, size, x + 10, y + 12, 12, 10, ...C.waterDark);
          fillRect(buf, size, x + 8, y + 4, 16, 4, ...C.woodDark);
        } else if (col === 10) {
          // Scriptorium Bookshelf
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 4, y + 4, 24, 26, ...C.woodDark);
          fillRect(buf, size, x + 6, y + 8, 20, 6, ...C.clothRed);
          fillRect(buf, size, x + 6, y + 18, 20, 6, ...C.clothBlue);
        } else if (col === 11) {
          // Alchemical Cauldron
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 8, y + 12, 16, 14, ...C.iron);
          fillRect(buf, size, x + 10, y + 10, 12, 6, ...C.emerald);
        } else if (col === 12) {
          // Arcane Rift Portal
          fillRect(buf, size, x, y, tileSize, tileSize, 10, 10, 20);
          fillRect(buf, size, x + 6, y + 6, 20, 20, ...C.clothPurple);
          fillRect(buf, size, x + 10, y + 10, 12, 12, 230, 180, 255);
        } else if (col === 13) {
          // Frost Geyser
          fillRect(buf, size, x, y, tileSize, tileSize, ...C.stoneMid);
          fillRect(buf, size, x + 8, y + 8, 16, 16, 20, 40, 60);
          fillRect(buf, size, x + 10, y + 10, 12, 12, 165, 243, 252);
        } else if (col === 14) {
          // Cactus (Desert)
          fillRect(buf, size, x, y, tileSize, tileSize, 217, 165, 85);
          fillRect(buf, size, x + 13, y + 6, 6, 22, ...C.grassDark);
          fillRect(buf, size, x + 7, y + 12, 6, 4, ...C.grassDark);
          fillRect(buf, size, x + 7, y + 8, 4, 8, ...C.grassDark);
          fillRect(buf, size, x + 19, y + 14, 6, 4, ...C.grassDark);
          fillRect(buf, size, x + 21, y + 10, 4, 8, ...C.grassDark);
        } else if (col === 15) {
          // Coral Reef
          fillRect(buf, size, x, y, tileSize, tileSize, 8, 50, 80);
          fillRect(buf, size, x + 8, y + 10, 16, 16, ...C.ruby);
          fillRect(buf, size, x + 12, y + 6, 6, 8, ...C.amethyst);
          fillRect(buf, size, x + 16, y + 12, 8, 8, ...C.copper);
        }
      }
    }
  }

  return encodePNG(size, size, buf);
}

/**
 * Generates comprehensive character & monster tileset (512x2304, 16 columns by 72 rows)
 * Fully aligned with TilesetAtlasManager.ts coordinate layout:
 * 18 Archetypes x 4 Directions (S, W, E, N) x 16 Animation Frames
 * Cols 0..3: Idle (consistent palette, subtle breathing & eye blink)
 * Cols 4..7: Walk cycle (bounce & leg step)
 * Cols 8..11: Attack action (weapon thrust/lunge)
 * Cols 12..13: Hurt reaction
 * Cols 14..15: Cast / ability
 */
function generateEntityTileset() {
  const width = 512; // 16 columns * 32px
  const height = 2304; // 72 rows * 32px
  const tileSize = 32;
  const buf = Buffer.alloc(width * height * 4);
  buf.fill(0); // Transparent background

  const entities = [
    { name: 'Hero Warrior', baseRow: 0, skin: [255, 237, 213], armor: [148, 163, 184], cape: [59, 130, 246], weapon: [226, 232, 240] },
    { name: 'Hero Mage', baseRow: 4, skin: [254, 240, 138], armor: [79, 70, 229], cape: [124, 58, 237], weapon: [168, 85, 247] },
    { name: 'Hero Rogue', baseRow: 8, skin: [254, 215, 170], armor: [51, 65, 85], cape: [15, 23, 42], weapon: [148, 163, 184] },
    { name: 'Town Guard', baseRow: 12, skin: [254, 215, 170], armor: [100, 116, 139], cape: [185, 28, 28], weapon: [226, 232, 240], isGuard: true },
    { name: 'Goblin Raider', baseRow: 16, skin: [34, 197, 94], armor: [120, 53, 15], cape: [133, 77, 14], weapon: [113, 113, 122], isGoblin: true },
    { name: 'Skeleton Minion', baseRow: 20, skin: [248, 250, 252], armor: [71, 85, 105], cape: [51, 65, 85], weapon: [148, 163, 184], isSkeleton: true },
    { name: 'Bloodfang Orc', baseRow: 24, skin: [21, 128, 61], armor: [69, 26, 3], cape: [153, 27, 27], weapon: [185, 28, 28], isOrc: true },
    { name: 'Cave Spider', baseRow: 28, skin: [30, 27, 75], armor: [49, 46, 129], cape: [67, 56, 202], weapon: [99, 102, 241], isSpider: true },
    { name: 'Dire Wolf', baseRow: 32, skin: [100, 116, 139], armor: [71, 85, 105], cape: [51, 65, 85], weapon: [148, 163, 184], isWolf: true },
    { name: 'Toxic Slime', baseRow: 36, skin: [16, 185, 129], armor: [5, 150, 105], cape: [4, 120, 87], weapon: [52, 211, 153], isSlime: true },
    { name: 'Town Civilian', baseRow: 40, skin: [255, 237, 213], armor: [180, 83, 9], cape: [2, 132, 199], weapon: [120, 53, 15], isCivilian: true },
    { name: 'Cat Companion', baseRow: 44, skin: [249, 115, 22], armor: [234, 88, 12], cape: [194, 65, 12], weapon: [253, 186, 116], isCat: true },
    { name: 'Wild Deer', baseRow: 48, skin: [180, 83, 9], armor: [120, 53, 15], cape: [146, 64, 14], weapon: [253, 224, 71], isDeer: true },
    { name: 'Wild Boar', baseRow: 52, skin: [120, 53, 15], armor: [69, 26, 3], cape: [41, 37, 36], weapon: [248, 250, 252], isBoar: true },
    { name: 'Mountain Goat', baseRow: 56, skin: [248, 250, 252], armor: [203, 213, 225], cape: [148, 163, 184], weapon: [100, 116, 139], isGoat: true },
    { name: 'Giant Rat', baseRow: 60, skin: [113, 113, 122], armor: [82, 82, 91], cape: [63, 63, 70], weapon: [239, 68, 68], isRat: true },
    { name: 'Wild Bear', baseRow: 64, skin: [69, 26, 3], armor: [41, 37, 36], cape: [28, 25, 23], weapon: [248, 250, 252], isBear: true },
    { name: 'Desert Camel', baseRow: 68, skin: [217, 119, 6], armor: [180, 83, 9], cape: [146, 64, 14], weapon: [253, 224, 71], isCamel: true },
  ];

  entities.forEach((ent) => {
    // 4 directions: 0 = South, 1 = West, 2 = East, 3 = North
    for (let dir = 0; dir < 4; dir++) {
      const row = ent.baseRow + dir;

      for (let col = 0; col < 16; col++) {
        const cx = col * tileSize;
        const cy = row * tileSize;
        const animPhase = col % 4;

        let bobY = 0;
        let armSwing = 0;

        if (col >= 0 && col <= 3) {
          // Idle breathing cycle: subtle 1px breathing, NO COLOR SWAPPING
          bobY = (animPhase === 1 || animPhase === 2) ? -1 : 0;
        } else if (col >= 4 && col <= 7) {
          // Walk bounce and step
          bobY = (animPhase % 2 === 1) ? -1 : 0;
          armSwing = (animPhase % 2 === 0) ? 2 : -2;
        } else if (col >= 8 && col <= 11) {
          // Attack lunge
          armSwing = (animPhase === 2) ? 6 : 2;
        } else if (col >= 12 && col <= 13) {
          // Hurt flinch
          bobY = 1;
        } else if (col >= 14 && col <= 15) {
          // Cast raise
          bobY = -2;
        }

        // 1. Cat Companion
        if (ent.isCat) {
          // Shadow
          fillRect(buf, width, cx + 8, cy + 24, 14, 4, 0, 0, 0, 80);
          // Body
          fillRect(buf, width, cx + 8, cy + 14 + bobY, 14, 10, ...ent.skin);
          // Head
          const headX = (dir === 1 ? cx + 4 : dir === 2 ? cx + 18 : cx + 10);
          fillRect(buf, width, headX, cy + 8 + bobY, 10, 8, ...ent.skin);
          // Ears
          fillRect(buf, width, headX + 1, cy + 5 + bobY, 3, 3, ...ent.armor);
          fillRect(buf, width, headX + 6, cy + 5 + bobY, 3, 3, ...ent.armor);
          // Tail
          fillRect(buf, width, cx + 5, cy + 12 + bobY + (animPhase % 2), 3, 6, ...ent.skin);
          continue;
        }

        // 2. Cave Spider
        if (ent.isSpider) {
          // Abdomen
          fillRect(buf, width, cx + 10, cy + 12 + bobY, 12, 12, ...ent.skin);
          // Eyes (red glowing)
          fillRect(buf, width, cx + 12, cy + 13 + bobY, 2, 2, 239, 68, 68);
          fillRect(buf, width, cx + 18, cy + 13 + bobY, 2, 2, 239, 68, 68);
          // Legs
          fillRect(buf, width, cx + 4, cy + 12 + bobY, 6, 2, ...ent.armor);
          fillRect(buf, width, cx + 22, cy + 12 + bobY, 6, 2, ...ent.armor);
          fillRect(buf, width, cx + 3, cy + 16 + bobY + armSwing, 7, 2, ...ent.armor);
          fillRect(buf, width, cx + 22, cy + 16 + bobY - armSwing, 7, 2, ...ent.armor);
          fillRect(buf, width, cx + 4, cy + 20 + bobY, 6, 2, ...ent.armor);
          fillRect(buf, width, cx + 22, cy + 20 + bobY, 6, 2, ...ent.armor);
          continue;
        }

        // 3. Toxic Slime
        if (ent.isSlime) {
          fillRect(buf, width, cx + 7, cy + 14 + bobY, 18, 12, ...ent.skin);
          fillRect(buf, width, cx + 10, cy + 11 + bobY, 12, 4, ...ent.armor);
          // Inner glowing core
          fillRect(buf, width, cx + 12, cy + 17 + bobY, 8, 6, ...ent.weapon);
          continue;
        }

        // 4. Dire Wolf
        if (ent.isWolf) {
          fillRect(buf, width, cx + 6, cy + 12 + bobY, 18, 10, ...ent.skin);
          const wolfHeadX = (dir === 1 ? cx + 2 : dir === 2 ? cx + 20 : cx + 10);
          fillRect(buf, width, wolfHeadX, cy + 8 + bobY, 10, 8, ...ent.skin);
          fillRect(buf, width, wolfHeadX + 2, cy + 5 + bobY, 2, 3, ...ent.armor);
          fillRect(buf, width, wolfHeadX + 6, cy + 5 + bobY, 2, 3, ...ent.armor);
          fillRect(buf, width, cx + 7, cy + 22 + bobY, 3, 6 + armSwing, ...ent.cape);
          fillRect(buf, width, cx + 13, cy + 22 + bobY, 3, 6 - armSwing, ...ent.cape);
          fillRect(buf, width, cx + 19, cy + 22 + bobY, 3, 6 + armSwing, ...ent.cape);
          continue;
        }

        // 5. Wild Deer
        if (ent.isDeer) {
          fillRect(buf, width, cx + 8, cy + 12 + bobY, 16, 9, ...ent.skin);
          fillRect(buf, width, cx + 9, cy + 21 + bobY, 2, 8 + armSwing, ...ent.armor);
          fillRect(buf, width, cx + 13, cy + 21 + bobY, 2, 8 - armSwing, ...ent.armor);
          fillRect(buf, width, cx + 19, cy + 21 + bobY, 2, 8 + armSwing, ...ent.armor);
          const dhx = (dir === 1 ? cx + 4 : dir === 2 ? cx + 20 : cx + 11);
          fillRect(buf, width, dhx, cy + 6 + bobY, 8, 8, ...ent.skin);
          // Antlers
          fillRect(buf, width, dhx + 1, cy + 2 + bobY, 2, 4, ...ent.weapon);
          fillRect(buf, width, dhx + 5, cy + 2 + bobY, 2, 4, ...ent.weapon);
          continue;
        }

        // 6. Wild Boar
        if (ent.isBoar) {
          fillRect(buf, width, cx + 6, cy + 12 + bobY, 20, 11, ...ent.skin);
          fillRect(buf, width, cx + 8, cy + 23 + bobY, 4, 5 + armSwing, ...ent.cape);
          fillRect(buf, width, cx + 14, cy + 23 + bobY, 4, 5 - armSwing, ...ent.cape);
          fillRect(buf, width, cx + 20, cy + 23 + bobY, 4, 5 + armSwing, ...ent.cape);
          const bhx = (dir === 1 ? cx + 2 : dir === 2 ? cx + 22 : cx + 10);
          fillRect(buf, width, bhx, cy + 10 + bobY, 10, 10, ...ent.armor);
          fillRect(buf, width, bhx + (dir === 1 ? 0 : 8), cy + 16 + bobY, 2, 3, ...ent.weapon);
          continue;
        }

        // 7. Mountain Goat
        if (ent.isGoat) {
          fillRect(buf, width, cx + 7, cy + 11 + bobY, 18, 10, ...ent.skin);
          fillRect(buf, width, cx + 9, cy + 21 + bobY, 3, 7 + armSwing, ...ent.weapon);
          fillRect(buf, width, cx + 14, cy + 21 + bobY, 3, 7 - armSwing, ...ent.weapon);
          fillRect(buf, width, cx + 19, cy + 21 + bobY, 3, 7 + armSwing, ...ent.weapon);
          const ghx = (dir === 1 ? cx + 3 : dir === 2 ? cx + 21 : cx + 11);
          fillRect(buf, width, ghx, cy + 7 + bobY, 8, 8, ...ent.armor);
          fillRect(buf, width, ghx + 1, cy + 3 + bobY, 3, 4, ...ent.weapon);
          fillRect(buf, width, ghx + 5, cy + 3 + bobY, 3, 4, ...ent.weapon);
          continue;
        }

        // 8. Giant Rat
        if (ent.isRat) {
          fillRect(buf, width, cx + 7, cy + 16 + bobY, 17, 8, ...ent.skin);
          const rhx = (dir === 1 ? cx + 2 : dir === 2 ? cx + 22 : cx + 11);
          fillRect(buf, width, rhx, cy + 14 + bobY, 8, 6, ...ent.armor);
          fillRect(buf, width, rhx + (dir === 1 ? 2 : dir === 2 ? 5 : 3), cy + 15 + bobY, 2, 2, 239, 68, 68);
          fillRect(buf, width, cx + 4, cy + 18 + bobY, 4, 2, ...ent.cape);
          fillRect(buf, width, cx + 9, cy + 24 + bobY, 3, 3 + armSwing, ...ent.armor);
          fillRect(buf, width, cx + 17, cy + 24 + bobY, 3, 3 - armSwing, ...ent.armor);
          continue;
        }

        // 9. Wild Bear
        if (ent.isBear) {
          fillRect(buf, width, cx + 5, cy + 10 + bobY, 22, 14, ...ent.skin);
          fillRect(buf, width, cx + 7, cy + 24 + bobY, 5, 6 + armSwing, ...ent.cape);
          fillRect(buf, width, cx + 14, cy + 24 + bobY, 4, 6 - armSwing, ...ent.cape);
          fillRect(buf, width, cx + 20, cy + 24 + bobY, 5, 6 + armSwing, ...ent.cape);
          const brhx = (dir === 1 ? cx + 1 : dir === 2 ? cx + 22 : cx + 9);
          fillRect(buf, width, brhx, cy + 8 + bobY, 12, 10, ...ent.armor);
          fillRect(buf, width, brhx + 1, cy + 5 + bobY, 3, 3, ...ent.armor);
          fillRect(buf, width, brhx + 8, cy + 5 + bobY, 3, 3, ...ent.armor);
          continue;
        }

        // 10. Desert Camel
        if (ent.isCamel) {
          fillRect(buf, width, cx + 6, cy + 12 + bobY, 20, 10, ...ent.skin);
          fillRect(buf, width, cx + 13, cy + 7 + bobY, 7, 6, ...ent.armor); // Hump
          const chx = (dir === 1 ? cx + 2 : dir === 2 ? cx + 22 : cx + 10);
          fillRect(buf, width, chx, cy + 4 + bobY, 7, 10, ...ent.skin);
          fillRect(buf, width, cx + 8, cy + 22 + bobY, 3, 8 + armSwing, ...ent.cape);
          fillRect(buf, width, cx + 14, cy + 22 + bobY, 3, 8 - armSwing, ...ent.cape);
          fillRect(buf, width, cx + 20, cy + 22 + bobY, 3, 8 + armSwing, ...ent.cape);
          continue;
        }

        // 11. Humanoid Characters (Warrior, Mage, Rogue, Town Guard, Goblin, Skeleton, Orc, Civilian)
        // Shadow
        fillRect(buf, width, cx + 7, cy + 27, 18, 4, 0, 0, 0, 80);

        // Head
        fillRect(buf, width, cx + 11, cy + 4 + bobY, 10, 8, ...ent.skin);

        // Helmet / Hair / Cowl
        fillRect(buf, width, cx + 10, cy + 2 + bobY, 12, 4, ...ent.armor);

        // Eyes (with subtle blink during idle frame 2)
        if (dir !== 3) {
          const isBlink = (col === 2 && animPhase === 2);
          const eyeColor = isBlink ? ent.skin : [15, 23, 42];
          const eyeX = (dir === 1 ? 12 : dir === 2 ? 17 : 13);
          fillRect(buf, width, cx + eyeX, cy + 7 + bobY, 2, isBlink ? 1 : 2, ...eyeColor);
          if (dir === 0) {
            fillRect(buf, width, cx + eyeX + 4, cy + 7 + bobY, 2, isBlink ? 1 : 2, ...eyeColor);
          }
        }

        // Torso / Cuirass / Clothing
        fillRect(buf, width, cx + 9, cy + 12 + bobY, 14, 10, ...ent.armor);

        // Legs & Boots
        fillRect(buf, width, cx + 10 + armSwing, cy + 22, 4, 7, 30, 41, 59);
        fillRect(buf, width, cx + 18 - armSwing, cy + 22, 4, 7, 30, 41, 59);

        // Specialized Archetype Details:
        if (ent.isGuard) {
          // Town Guard: Golden helmet crest, Royal Crimson Tabard with cross, heater shield & halberd spear
          fillRect(buf, width, cx + 14, cy + 0 + bobY, 4, 3, ...C.gold); // Gold helmet plume
          fillRect(buf, width, cx + 12, cy + 13 + bobY, 8, 8, ...ent.cape); // Royal red tabard
          fillRect(buf, width, cx + 15, cy + 13 + bobY, 2, 8, ...C.gold); // Gold cross trim
          fillRect(buf, width, cx + 12, cy + 16 + bobY, 8, 2, ...C.gold);

          // Shield on off-hand
          const shieldX = (dir === 1 ? cx + 21 : cx + 3);
          fillRect(buf, width, shieldX, cy + 11 + bobY, 6, 12, ...C.steelLight);
          fillRect(buf, width, shieldX + 1, cy + 12 + bobY, 4, 10, ...C.clothRed);
          fillRect(buf, width, shieldX + 2, cy + 15 + bobY, 2, 4, ...C.gold);

          // Guard Halberd / Spear
          const spearX = (dir === 1 ? cx + 3 : cx + 25);
          if (col >= 8 && col <= 11) {
            // Attack thrust forward
            fillRect(buf, width, cx + (dir === 1 ? 0 : 20), cy + 14 + bobY, 12, 2, ...C.woodDark);
            fillRect(buf, width, cx + (dir === 1 ? 0 : 28), cy + 12 + bobY, 4, 6, ...C.steelLight);
          } else {
            // Upright halberd
            fillRect(buf, width, spearX, cy + 1 + bobY, 2, 24, ...C.woodDark);
            fillRect(buf, width, spearX - 1, cy + 0 + bobY, 4, 5, ...C.steelLight);
            fillRect(buf, width, spearX + 2, cy + 2 + bobY, 2, 3, ...C.gold); // Axe blade
          }
        } else if (ent.isGoblin) {
          // Pointed Goblin Ears
          fillRect(buf, width, cx + 8, cy + 5 + bobY, 3, 2, ...ent.skin);
          fillRect(buf, width, cx + 21, cy + 5 + bobY, 3, 2, ...ent.skin);
          // Crude dagger
          fillRect(buf, width, cx + (dir === 1 ? 4 : 24), cy + 14 + bobY, 2, 8, ...ent.weapon);
        } else if (ent.isSkeleton) {
          // Bony ribs
          fillRect(buf, width, cx + 11, cy + 14 + bobY, 10, 1, 15, 23, 42);
          fillRect(buf, width, cx + 11, cy + 17 + bobY, 10, 1, 15, 23, 42);
          // Ancient rusted blade
          fillRect(buf, width, cx + (dir === 1 ? 4 : 24), cy + 14 + bobY, 2, 8, ...ent.weapon);
        } else if (ent.isOrc) {
          // Tusks
          fillRect(buf, width, cx + 12, cy + 10 + bobY, 2, 3, 255, 255, 255);
          fillRect(buf, width, cx + 18, cy + 10 + bobY, 2, 3, 255, 255, 255);
          // Spiked war axe
          fillRect(buf, width, cx + (dir === 1 ? 3 : 24), cy + 10 + bobY, 4, 12, ...ent.weapon);
        } else if (ent.isCivilian) {
          // Leather merchant apron & satchel
          fillRect(buf, width, cx + 11, cy + 15 + bobY, 10, 7, 120, 53, 15);
          fillRect(buf, width, cx + 8, cy + 14 + bobY, 4, 5, ...C.woodMid);
        } else {
          // Standard Hero Weapon
          if (col >= 8 && col <= 11) {
            // Weapon slash
            fillRect(buf, width, cx + (dir === 1 ? 2 : 24), cy + 10 + bobY, 6, 2, ...ent.weapon);
            fillRect(buf, width, cx + (dir === 1 ? 4 : 26), cy + 6 + bobY, 2, 10, ...ent.weapon);
          } else {
            fillRect(buf, width, cx + (dir === 1 ? 4 : 24), cy + 14 + bobY, 2, 8, ...ent.weapon);
          }
        }
      }
    }
  });

  return encodePNG(width, height, buf);
}

/**
 * Generates animation cycle mockup atlas (512x512, 4 animation frames per entity)
 */
function generateAnimationsTileset() {
  const size = 512;
  const tileSize = 32;
  const buf = Buffer.alloc(size * size * 4);
  buf.fill(0);

  const actors = [
    { row: 0, name: 'Player Knight', color: C.clothBlue, head: C.skin, helm: C.steelLight },
    { row: 1, name: 'Shadow Rogue', color: [71, 85, 105], head: C.skin, helm: [30, 41, 59] },
    { row: 2, name: 'Arcane Mage', color: C.clothPurple, head: C.skin, helm: [107, 33, 168] },
    { row: 3, name: 'Goblin Scout', color: [22, 101, 52], head: [34, 197, 94] },
    { row: 4, name: 'Skeleton Warrior', color: C.steel, head: C.steelLight },
    { row: 5, name: 'Companion Cat', color: C.gold, head: C.goldLight, isCat: true },
    { row: 6, name: 'Town Guard', color: [185, 28, 28], head: C.skin, helm: C.steel, isGuard: true },
  ];

  actors.forEach((act) => {
    const y = act.row * tileSize;

    // Frame 0: Idle
    let x0 = 0 * tileSize;
    fillRect(buf, size, x0 + 8, y + 26, 16, 4, 0, 0, 0, 80);
    fillRect(buf, size, x0 + 10, y + 13, 12, 11, ...act.color);
    fillRect(buf, size, x0 + 11, y + 5, 10, 8, ...act.head);
    if (act.isGuard) {
      fillRect(buf, size, x0 + 14, y + 2, 4, 3, ...C.gold); // Gold crest
      fillRect(buf, size, x0 + 3, y + 13, 5, 10, ...C.steelLight); // Shield
      fillRect(buf, size, x0 + 25, y + 2, 2, 22, ...C.woodDark); // Spear
      fillRect(buf, size, x0 + 24, y + 1, 4, 4, ...C.steelLight);
    }

    // Frame 1: Walk Step Left
    let x1 = 1 * tileSize;
    fillRect(buf, size, x1 + 8, y + 26, 16, 4, 0, 0, 0, 80);
    fillRect(buf, size, x1 + 10, y + 12, 12, 11, ...act.color);
    fillRect(buf, size, x1 + 11, y + 4, 10, 8, ...act.head);
    fillRect(buf, size, x1 + 9, y + 23, 4, 5, 30, 30, 40); // left foot forward
    if (act.isGuard) {
      fillRect(buf, size, x1 + 14, y + 1, 4, 3, ...C.gold);
      fillRect(buf, size, x1 + 3, y + 12, 5, 10, ...C.steelLight);
      fillRect(buf, size, x1 + 25, y + 1, 2, 22, ...C.woodDark);
      fillRect(buf, size, x1 + 24, y + 0, 4, 4, ...C.steelLight);
    }

    // Frame 2: Walk Step Right
    let x2 = 2 * tileSize;
    fillRect(buf, size, x2 + 8, y + 26, 16, 4, 0, 0, 0, 80);
    fillRect(buf, size, x2 + 10, y + 12, 12, 11, ...act.color);
    fillRect(buf, size, x2 + 11, y + 4, 10, 8, ...act.head);
    fillRect(buf, size, x2 + 19, y + 23, 4, 5, 30, 30, 40); // right foot forward
    if (act.isGuard) {
      fillRect(buf, size, x2 + 14, y + 1, 4, 3, ...C.gold);
      fillRect(buf, size, x2 + 3, y + 12, 5, 10, ...C.steelLight);
      fillRect(buf, size, x2 + 25, y + 1, 2, 22, ...C.woodDark);
      fillRect(buf, size, x2 + 24, y + 0, 4, 4, ...C.steelLight);
    }

    // Frame 3: Attack Strike / Lunge
    let x3 = 3 * tileSize;
    fillRect(buf, size, x3 + 8, y + 26, 18, 4, 0, 0, 0, 80);
    fillRect(buf, size, x3 + 12, y + 13, 13, 11, ...act.color); // lunging forward
    fillRect(buf, size, x3 + 13, y + 5, 10, 8, ...act.head);
    if (act.isGuard) {
      fillRect(buf, size, x3 + 16, y + 2, 4, 3, ...C.gold);
      fillRect(buf, size, x3 + 5, y + 13, 5, 10, ...C.steelLight);
      // Spear thrust forward
      fillRect(buf, size, x3 + 22, y + 14, 10, 2, ...C.woodDark);
      fillRect(buf, size, x3 + 30, y + 12, 4, 6, ...C.steelLight);
    } else {
      // Weapon slash arc
      fillRect(buf, size, x3 + 24, y + 8, 6, 2, ...C.steelLight);
      fillRect(buf, size, x3 + 28, y + 10, 2, 8, ...C.steelLight);
    }
  });

  return encodePNG(size, size, buf);
}

/**
 * Generates oversized bosses tileset (512x512)
 */
function generateBossTileset() {
  const size = 512;
  const buf = Buffer.alloc(size * size * 4);
  buf.fill(0);

  // Red Fire Dragon (64x64 at 0,0)
  fillRect(buf, size, 8, 8, 48, 48, ...C.ruby);
  fillRect(buf, size, 14, 14, 36, 36, 185, 28, 28);
  fillRect(buf, size, 18, 18, 12, 12, ...C.gold); // Eye
  fillRect(buf, size, 34, 4, 20, 20, 220, 38, 38); // Wing tip

  // Stone Golem (64x64 at 64,0)
  fillRect(buf, size, 72, 8, 48, 48, ...C.stoneDark);
  fillRect(buf, size, 78, 14, 36, 36, ...C.stoneMid);
  fillRect(buf, size, 86, 22, 6, 6, 6, 182, 212); // Glowing runic eye
  fillRect(buf, size, 100, 22, 6, 6, 6, 182, 212);

  return encodePNG(size, size, buf);
}

/**
 * Generates items & equipment tileset (512x512)
 */
function generateItemsTileset() {
  const size = 512;
  const tileSize = 32;
  const buf = Buffer.alloc(size * size * 4);
  buf.fill(0);

  const items = [
    { col: 0, row: 0, type: 'sword' },
    { col: 1, row: 0, type: 'staff' },
    { col: 2, row: 0, type: 'shield' },
    { col: 3, row: 0, type: 'potion_red' },
    { col: 4, row: 0, type: 'potion_blue' },
    { col: 5, row: 0, type: 'scroll' },
    { col: 6, row: 0, type: 'gem_ruby' },
    { col: 7, row: 0, type: 'gem_amethyst' },
    { col: 8, row: 0, type: 'bow' },
    { col: 9, row: 0, type: 'helm' },
    { col: 10, row: 0, type: 'armor' },
    { col: 11, row: 0, type: 'boots' },
    { col: 12, row: 0, type: 'amulet' },
    { col: 13, row: 0, type: 'catalyst_fire' },
    { col: 14, row: 0, type: 'catalyst_frost' },
    { col: 15, row: 0, type: 'meat' },
  ];

  items.forEach((item) => {
    const x = item.col * tileSize;
    const y = item.row * tileSize;

    if (item.type === 'sword') {
      fillRect(buf, size, x + 8, y + 22, 4, 4, ...C.woodDark); // hilt
      fillRect(buf, size, x + 10, y + 18, 8, 4, ...C.gold); // guard
      fillRect(buf, size, x + 16, y + 6, 4, 14, ...C.steelLight); // blade
    } else if (item.type === 'staff') {
      fillRect(buf, size, x + 6, y + 6, 4, 20, ...C.woodDark);
      fillRect(buf, size, x + 18, y + 6, 6, 6, ...C.amethyst);
    } else if (item.type === 'shield') {
      fillRect(buf, size, x + 8, y + 6, 16, 20, ...C.steel);
      fillRect(buf, size, x + 10, y + 8, 12, 16, ...C.clothBlue);
      fillRect(buf, size, x + 14, y + 12, 4, 8, ...C.gold);
    } else if (item.type === 'potion_red') {
      fillRect(buf, size, x + 12, y + 8, 8, 4, ...C.woodLight); // cork
      fillRect(buf, size, x + 8, y + 12, 16, 14, ...C.ruby);
    } else if (item.type === 'potion_blue') {
      fillRect(buf, size, x + 12, y + 8, 8, 4, ...C.woodLight); // cork
      fillRect(buf, size, x + 8, y + 12, 16, 14, ...C.waterMid);
    } else if (item.type === 'scroll') {
      fillRect(buf, size, x + 8, y + 8, 16, 16, ...C.goldLight);
      fillRect(buf, size, x + 10, y + 12, 12, 2, ...C.woodDark);
    } else if (item.type.startsWith('gem_')) {
      fillRect(buf, size, x + 10, y + 10, 12, 12, item.type.includes('ruby') ? C.ruby[0] : C.amethyst[0], item.type.includes('ruby') ? C.ruby[1] : C.amethyst[1], item.type.includes('ruby') ? C.ruby[2] : C.amethyst[2]);
      fillRect(buf, size, x + 12, y + 12, 4, 4, ...C.white);
    } else if (item.type === 'bow') {
      fillRect(buf, size, x + 6, y + 6, 4, 20, ...C.woodDark);
      fillRect(buf, size, x + 10, y + 8, 2, 16, ...C.white);
    } else if (item.type === 'helm') {
      fillRect(buf, size, x + 8, y + 8, 16, 16, ...C.steelLight);
      fillRect(buf, size, x + 10, y + 14, 12, 4, 20, 20, 20); // visor
    } else if (item.type === 'armor') {
      fillRect(buf, size, x + 8, y + 8, 16, 18, ...C.steelLight);
      fillRect(buf, size, x + 12, y + 10, 8, 12, ...C.gold);
    } else if (item.type === 'boots') {
      fillRect(buf, size, x + 8, y + 12, 16, 12, ...C.woodDark);
      fillRect(buf, size, x + 6, y + 20, 20, 4, ...C.iron);
    } else if (item.type === 'amulet') {
      fillRect(buf, size, x + 10, y + 6, 12, 8, ...C.goldLight);
      fillRect(buf, size, x + 12, y + 14, 8, 10, ...C.ruby);
    } else if (item.type === 'catalyst_fire') {
      fillRect(buf, size, x + 8, y + 8, 16, 16, 240, 80, 20);
      fillRect(buf, size, x + 12, y + 12, 8, 8, ...C.goldLight);
    } else if (item.type === 'catalyst_frost') {
      fillRect(buf, size, x + 8, y + 8, 16, 16, 6, 182, 212);
      fillRect(buf, size, x + 12, y + 12, 8, 8, ...C.white);
    } else if (item.type === 'meat') {
      fillRect(buf, size, x + 8, y + 12, 16, 12, 180, 80, 50);
      fillRect(buf, size, x + 20, y + 8, 4, 8, ...C.white); // bone
    }
  });

  return encodePNG(size, size, buf);
}

// Ensure output directory exists
const targetDir = path.join(__dirname, '..', 'public', 'tilesets');
fs.mkdirSync(targetDir, { recursive: true });

console.log('📦 Generating mockup PNG tilesets into /public/tilesets...');

fs.writeFileSync(path.join(targetDir, 'main_tileset.png'), generateMainTileset());
console.log('✅ Generated public/tilesets/main_tileset.png');

fs.writeFileSync(path.join(targetDir, 'entity_tileset.png'), generateEntityTileset());
console.log('✅ Generated public/tilesets/entity_tileset.png');

fs.writeFileSync(path.join(targetDir, 'animations_tileset.png'), generateAnimationsTileset());
console.log('✅ Generated public/tilesets/animations_tileset.png');

fs.writeFileSync(path.join(targetDir, 'boss_tileset.png'), generateBossTileset());
console.log('✅ Generated public/tilesets/boss_tileset.png');

fs.writeFileSync(path.join(targetDir, 'items_tileset.png'), generateItemsTileset());
console.log('✅ Generated public/tilesets/items_tileset.png');

console.log('🎉 Successfully created all mockup PNG tileset files!');
