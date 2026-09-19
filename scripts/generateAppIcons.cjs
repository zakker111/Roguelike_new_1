/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Generates production-ready standalone PNG icons and OpenGraph social card
 * into /public/ using pure Node.js standard libraries.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 Table
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

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // 8 bits per channel
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; // Deflate compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdr = createChunk('IHDR', ihdrData);

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

function setPixel(buf, width, height, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (y * width + x) * 4;
  buf[idx] = r;
  buf[idx + 1] = g;
  buf[idx + 2] = b;
  buf[idx + 3] = a;
}

function blendPixel(buf, width, height, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (y * width + x) * 4;
  const alpha = a / 255;
  const invAlpha = 1 - alpha;
  buf[idx] = Math.round(r * alpha + buf[idx] * invAlpha);
  buf[idx + 1] = Math.round(g * alpha + buf[idx + 1] * invAlpha);
  buf[idx + 2] = Math.round(b * alpha + buf[idx + 2] * invAlpha);
  buf[idx + 3] = Math.min(255, Math.round(a + buf[idx + 3] * invAlpha));
}

// Generate Roguelike Emblem Icon (Square)
function generateSquareEmblem(size) {
  const buf = Buffer.alloc(size * size * 4);
  const center = size / 2;
  const radius = size * 0.44;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep dark slate radial gradient
      const normDist = dist / (size * 0.7);
      const bgR = Math.max(8, Math.round(15 - normDist * 8));
      const bgG = Math.max(13, Math.round(23 - normDist * 10));
      const bgB = Math.max(26, Math.round(42 - normDist * 15));

      setPixel(buf, size, size, x, y, bgR, bgG, bgB, 255);

      // Outer shield border
      if (Math.abs(dist - radius) < size * 0.02) {
        blendPixel(buf, size, size, x, y, 71, 85, 105, 200); // Slate border
      } else if (dist < radius && Math.abs(dist - radius * 0.94) < size * 0.015) {
        blendPixel(buf, size, size, x, y, 56, 189, 248, 140); // Cyan ring
      }
    }
  }

  // Draw Central Glowing Sword & Anvil Emblem
  const scale = size / 128;
  const midX = Math.round(center);

  // Anvil base
  for (let y = Math.round(center + 18 * scale); y <= Math.round(center + 30 * scale); y++) {
    const widthAtY = Math.round((28 - (y - (center + 18 * scale)) * 0.4) * scale);
    for (let x = midX - widthAtY; x <= midX + widthAtY; x++) {
      blendPixel(buf, size, size, x, y, 51, 65, 85, 240);
    }
  }

  // Sword Blade (vertical)
  const bladeTop = Math.round(center - 44 * scale);
  const bladeBottom = Math.round(center + 10 * scale);
  for (let y = bladeTop; y <= bladeBottom; y++) {
    const progress = (y - bladeTop) / (bladeBottom - bladeTop);
    const bladeHalfWidth = Math.max(1, Math.round((2 + progress * 6) * scale));
    for (let x = midX - bladeHalfWidth; x <= midX + bladeHalfWidth; x++) {
      // Shimmer gradient from cyan to violet
      const r = Math.round(56 + progress * 130);
      const g = Math.round(189 - progress * 60);
      const b = Math.round(248 - progress * 10);
      blendPixel(buf, size, size, x, y, r, g, b, 255);
    }
    // Fuller (center line)
    blendPixel(buf, size, size, midX, y, 255, 255, 255, 220);
  }

  // Sword Crossguard
  const guardY = Math.round(center + 10 * scale);
  const guardWidth = Math.round(24 * scale);
  const guardHeight = Math.round(6 * scale);
  for (let y = guardY; y < guardY + guardHeight; y++) {
    for (let x = midX - guardWidth; x <= midX + guardWidth; x++) {
      blendPixel(buf, size, size, x, y, 234, 179, 8, 255); // Golden crossguard
    }
  }
  // Gem in guard
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      blendPixel(buf, size, size, midX + dx, guardY + 3 + dy, 56, 189, 248, 255);
    }
  }

  // Hilt
  for (let y = guardY + guardHeight; y <= guardY + guardHeight + 10 * scale; y++) {
    for (let x = midX - Math.round(2 * scale); x <= midX + Math.round(2 * scale); x++) {
      blendPixel(buf, size, size, x, y, 120, 53, 15, 255);
    }
  }

  // Pommel
  const pommelY = Math.round(guardY + guardHeight + 12 * scale);
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (dx * dx + dy * dy <= 9) {
        blendPixel(buf, size, size, midX + dx, pommelY + dy, 234, 179, 8, 255);
      }
    }
  }

  return encodePNG(size, size, buf);
}

// Generate OpenGraph Social Share Card (1200x630)
function generateOgImage(width = 1200, height = 630) {
  const buf = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    const normY = y / height;
    for (let x = 0; x < width; x++) {
      const normX = x / width;
      const dx = normX - 0.5;
      const dy = normY - 0.5;
      const dist = Math.sqrt(dx * dx * 1.6 + dy * dy);

      // Deep dark fantasy vignette
      const vignette = Math.max(0, 1 - dist * 1.1);
      const r = Math.round(9 + vignette * 16);
      const g = Math.round(13 + vignette * 22);
      const b = Math.round(24 + vignette * 42);

      setPixel(buf, width, height, x, y, r, g, b, 255);

      // Subtle dungeon grid lines
      if ((x % 40 === 0 || y % 40 === 0) && vignette > 0.3) {
        blendPixel(buf, width, height, x, y, 30, 41, 59, 60);
      }
    }
  }

  // Left side: Large RPG Emblem
  const emblemCenter = { x: 260, y: 315 };
  const emblemSize = 360;
  const radius = emblemSize * 0.45;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - emblemCenter.x;
      const dy = y - emblemCenter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        const falloff = 1 - (dist / radius);
        blendPixel(buf, width, height, x, y, 30, 58, 138, Math.round(falloff * 90)); // Soft magic aura
      }
      if (Math.abs(dist - radius) < 4) {
        blendPixel(buf, width, height, x, y, 56, 189, 248, 180); // Cyan ring
      }
      if (Math.abs(dist - (radius - 12)) < 2) {
        blendPixel(buf, width, height, x, y, 234, 179, 8, 160); // Gold inner ring
      }
    }
  }

  // Draw Central Sword inside the Emblem
  const scale = 2.4;
  const midX = emblemCenter.x;
  const midY = emblemCenter.y;

  const bladeTop = Math.round(midY - 90 * scale * 0.5);
  const bladeBottom = Math.round(midY + 20 * scale * 0.5);
  for (let y = bladeTop; y <= bladeBottom; y++) {
    const progress = (y - bladeTop) / (bladeBottom - bladeTop);
    const bladeHalfWidth = Math.max(2, Math.round((2 + progress * 6) * scale * 0.7));
    for (let x = midX - bladeHalfWidth; x <= midX + bladeHalfWidth; x++) {
      const r = Math.round(56 + progress * 130);
      const g = Math.round(189 - progress * 60);
      const b = Math.round(248);
      blendPixel(buf, width, height, x, y, r, g, b, 255);
    }
    blendPixel(buf, width, height, midX, y, 255, 255, 255, 230);
  }

  // Crossguard
  const guardY = bladeBottom;
  const guardWidth = Math.round(26 * scale);
  for (let y = guardY; y < guardY + 12; y++) {
    for (let x = midX - guardWidth; x <= midX + guardWidth; x++) {
      blendPixel(buf, width, height, x, y, 234, 179, 8, 255);
    }
  }

  // Hilt
  for (let y = guardY + 12; y <= guardY + 34; y++) {
    for (let x = midX - 4; x <= midX + 4; x++) {
      blendPixel(buf, width, height, x, y, 120, 53, 15, 255);
    }
  }

  // Pommel
  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      if (dx * dx + dy * dy <= 36) {
        blendPixel(buf, width, height, midX + dx, guardY + 40 + dy, 234, 179, 8, 255);
      }
    }
  }

  return encodePNG(width, height, buf);
}

// Generate files into public directory
const publicDir = path.resolve(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating production app icons and OpenGraph card...');

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), generateSquareEmblem(192));
console.log('✓ Created public/icon-192.png (192x192)');

fs.writeFileSync(path.join(publicDir, 'icon-512.png'), generateSquareEmblem(512));
console.log('✓ Created public/icon-512.png (512x512)');

fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateSquareEmblem(180));
console.log('✓ Created public/apple-touch-icon.png (180x180)');

fs.writeFileSync(path.join(publicDir, 'og-image.png'), generateOgImage(1200, 630));
console.log('✓ Created public/og-image.png (1200x630)');

console.log('All production assets generated successfully!');
