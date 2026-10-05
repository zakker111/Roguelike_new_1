/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MockupPaletteTheme } from './types';

/**
 * Procedurally generates the 16x72 Entity & Character Animation Atlas
 */
export function renderEntityTileset(theme: MockupPaletteTheme = 'classic', size: number = 32): HTMLCanvasElement {
  const cols = 16;
  const rows = 72;
  const canvas = document.createElement('canvas');
  canvas.width = cols * size;
  canvas.height = rows * size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const entities = [
    { name: 'Hero Warrior', baseRow: 0, skin: '#ffedd5', armor: '#94a3b8', cape: '#3b82f6', weapon: '#e2e8f0' },
    { name: 'Hero Mage', baseRow: 4, skin: '#fef08a', armor: '#4f46e5', cape: '#7c3aed', weapon: '#a855f7' },
    { name: 'Hero Rogue', baseRow: 8, skin: '#fed7aa', armor: '#334155', cape: '#0f172a', weapon: '#94a3b8' },
    { name: 'Town Guard', baseRow: 12, skin: '#fed7aa', armor: '#64748b', cape: '#b91c1c', weapon: '#e2e8f0' },
    { name: 'Goblin Raider', baseRow: 16, skin: '#22c55e', armor: '#78350f', cape: '#854d0e', weapon: '#71717a' },
    { name: 'Skeleton Minion', baseRow: 20, skin: '#f8fafc', armor: '#475569', cape: '#334155', weapon: '#94a3b8' },
    { name: 'Bloodfang Orc', baseRow: 24, skin: '#15803d', armor: '#451a03', cape: '#991b1b', weapon: '#b91c1c' },
    { name: 'Cave Spider', baseRow: 28, skin: '#1e1b4b', armor: '#312e81', cape: '#4338ca', weapon: '#6366f1' },
    { name: 'Dire Wolf', baseRow: 32, skin: '#64748b', armor: '#475569', cape: '#334155', weapon: '#94a3b8' },
    { name: 'Toxic Slime', baseRow: 36, skin: '#10b981', armor: '#059669', cape: '#047857', weapon: '#34d399' },
    { name: 'Town Civilian', baseRow: 40, skin: '#ffedd5', armor: '#b45309', cape: '#0284c7', weapon: '#78350f' },
    { name: 'Cat Companion', baseRow: 44, skin: '#f97316', armor: '#ea580c', cape: '#c2410c', weapon: '#fdba74' },
    { name: 'Wild Deer', baseRow: 48, skin: '#b45309', armor: '#78350f', cape: '#92400e', weapon: '#fde047' },
    { name: 'Wild Boar', baseRow: 52, skin: '#78350f', armor: '#451a03', cape: '#292524', weapon: '#f8fafc' },
    { name: 'Mountain Goat', baseRow: 56, skin: '#f8fafc', armor: '#cbd5e1', cape: '#94a3b8', weapon: '#64748b' },
    { name: 'Giant Rat', baseRow: 60, skin: '#71717a', armor: '#52525b', cape: '#3f3f46', weapon: '#ef4444' },
    { name: 'Wild Bear', baseRow: 64, skin: '#451a03', armor: '#292524', cape: '#1c1917', weapon: '#f8fafc' },
    { name: 'Desert Camel', baseRow: 68, skin: '#d97706', armor: '#b45309', cape: '#92400e', weapon: '#fde047' },
  ];

  for (const ent of entities) {
    // 4 directions: 0 = South, 1 = West, 2 = East, 3 = North
    for (let dir = 0; dir < 4; dir++) {
      const row = ent.baseRow + dir;

      // 16 animation frames:
      // Col 0..3: Idle
      // Col 4..7: Walk
      // Col 8..11: Attack
      // Col 12..13: Hurt
      // Col 14..15: Cast
      for (let col = 0; col < 16; col++) {
        const cx = col * size;
        const cy = row * size;

        // Animation phase offset
        const animPhase = col % 4;
        let bobY = 0;
        let armSwing = 0;

        if (col >= 0 && col <= 3) {
          // Subtle idle breathing
          bobY = (animPhase === 1 || animPhase === 2) ? -1 : 0;
        } else if (col >= 4 && col <= 7) {
          // Walk bounce
          bobY = (animPhase % 2 === 1) ? -1 : 0;
          armSwing = (animPhase % 2 === 0) ? 2 : -2;
        } else if (col >= 8 && col <= 11) {
          // Attack lunge
          armSwing = (animPhase === 2) ? 6 : 2;
        } else if (col >= 12 && col <= 13) {
          // Hurt shake
          bobY = 1;
        } else if (col >= 14 && col <= 15) {
          // Cast raise
          bobY = -2;
        }

        // Draw humanoid or animal character sprite
        if (ent.name === 'Cat Companion') {
          // Cat Body
          ctx.fillStyle = ent.skin;
          ctx.fillRect(cx + 8, cy + 14 + bobY, 14, 10);
          // Head & Ears
          ctx.fillRect(cx + (dir === 1 ? 4 : dir === 2 ? 18 : 10), cy + 8 + bobY, 10, 8);
          ctx.fillStyle = '#431407';
          ctx.fillRect(cx + 10, cy + 6 + bobY, 2, 3); // Left ear
          ctx.fillRect(cx + 16, cy + 6 + bobY, 2, 3); // Right ear
          // Tail twitch
          ctx.fillStyle = ent.skin;
          ctx.fillRect(cx + 6, cy + 10 + bobY + (animPhase % 2), 3, 6);
        } else if (ent.name === 'Cave Spider') {
          // Spider Abdomen & Legs
          ctx.fillStyle = ent.skin;
          ctx.beginPath();
          ctx.arc(cx + size * 0.5, cy + size * 0.5 + bobY, 8, 0, Math.PI * 2);
          ctx.fill();
          // Eyes
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(cx + 12, cy + 10 + bobY, 2, 2);
          ctx.fillRect(cx + 18, cy + 10 + bobY, 2, 2);
          // 8 Legs
          ctx.strokeStyle = ent.armor;
          ctx.lineWidth = 1.5;
          for (let l = 0; l < 4; l++) {
            ctx.beginPath();
            ctx.moveTo(cx + 8, cy + 12 + l * 3 + bobY);
            ctx.lineTo(cx + 2, cy + 8 + l * 4 + bobY + armSwing);
            ctx.moveTo(cx + 24, cy + 12 + l * 3 + bobY);
            ctx.lineTo(cx + 30, cy + 8 + l * 4 + bobY - armSwing);
            ctx.stroke();
          }
        } else if (ent.name === 'Toxic Slime') {
          // Slime Jelly Blob
          ctx.fillStyle = ent.skin;
          ctx.beginPath();
          ctx.ellipse(cx + size * 0.5, cy + size * 0.6 + bobY, 10 + bobY, 8 - bobY, 0, 0, Math.PI * 2);
          ctx.fill();
          // Core
          ctx.fillStyle = ent.weapon;
          ctx.beginPath();
          ctx.arc(cx + size * 0.5, cy + size * 0.6 + bobY, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (ent.name === 'Dire Wolf') {
          // Wolf Body
          ctx.fillStyle = ent.skin;
          ctx.fillRect(cx + 6, cy + 12 + bobY, 18, 10);
          // Head & Snout
          const hx = dir === 1 ? cx + 2 : dir === 2 ? cx + 20 : cx + 10;
          ctx.fillRect(hx, cy + 8 + bobY, 10, 8);
          // Ears
          ctx.fillStyle = ent.armor;
          ctx.fillRect(hx + 2, cy + 5 + bobY, 2, 3);
          ctx.fillRect(hx + 6, cy + 5 + bobY, 2, 3);
          // Legs
          ctx.fillStyle = ent.cape;
          ctx.fillRect(cx + 7, cy + 22 + bobY, 3, 6 + armSwing);
          ctx.fillRect(cx + 12, cy + 22 + bobY, 3, 6 - armSwing);
          ctx.fillRect(cx + 18, cy + 22 + bobY, 3, 6 + armSwing);
          // Bushy Tail
          ctx.fillStyle = ent.armor;
          ctx.fillRect(cx + 4, cy + 13 + bobY, 4, 6);
        } else if (ent.name === 'Wild Deer') {
          // Deer Body
          ctx.fillStyle = ent.skin;
          ctx.fillRect(cx + 8, cy + 12 + bobY, 16, 9);
          // Slender Legs
          ctx.fillStyle = ent.armor;
          ctx.fillRect(cx + 9, cy + 21 + bobY, 2, 8 + armSwing);
          ctx.fillRect(cx + 13, cy + 21 + bobY, 2, 8 - armSwing);
          ctx.fillRect(cx + 19, cy + 21 + bobY, 2, 8 + armSwing);
          // Head & Neck
          const dhx = dir === 1 ? cx + 4 : dir === 2 ? cx + 20 : cx + 11;
          ctx.fillStyle = ent.skin;
          ctx.fillRect(dhx, cy + 6 + bobY, 8, 8);
          // Antlers
          ctx.fillStyle = ent.weapon;
          ctx.fillRect(dhx + 1, cy + 2 + bobY, 2, 4);
          ctx.fillRect(dhx + 5, cy + 2 + bobY, 2, 4);
          ctx.fillRect(dhx - 1, cy + 2 + bobY, 4, 2);
          ctx.fillRect(dhx + 5, cy + 2 + bobY, 4, 2);
        } else if (ent.name === 'Wild Boar') {
          // Boar Body
          ctx.fillStyle = ent.skin;
          ctx.fillRect(cx + 6, cy + 12 + bobY, 20, 11);
          // Stout Legs
          ctx.fillStyle = ent.cape;
          ctx.fillRect(cx + 8, cy + 23 + bobY, 4, 5 + armSwing);
          ctx.fillRect(cx + 14, cy + 23 + bobY, 4, 5 - armSwing);
          ctx.fillRect(cx + 20, cy + 23 + bobY, 4, 5 + armSwing);
          // Head & Snout
          const bhx = dir === 1 ? cx + 2 : dir === 2 ? cx + 22 : cx + 10;
          ctx.fillStyle = ent.armor;
          ctx.fillRect(bhx, cy + 10 + bobY, 10, 10);
          // Tusks
          ctx.fillStyle = ent.weapon;
          ctx.fillRect(bhx + (dir === 1 ? 0 : 8), cy + 16 + bobY, 2, 3);
        } else if (ent.name === 'Mountain Goat') {
          // Goat Fleece Body
          ctx.fillStyle = ent.skin;
          ctx.fillRect(cx + 7, cy + 11 + bobY, 18, 10);
          // Legs
          ctx.fillStyle = ent.weapon;
          ctx.fillRect(cx + 9, cy + 21 + bobY, 3, 7 + armSwing);
          ctx.fillRect(cx + 14, cy + 21 + bobY, 3, 7 - armSwing);
          ctx.fillRect(cx + 19, cy + 21 + bobY, 3, 7 + armSwing);
          // Head
          const ghx = dir === 1 ? cx + 3 : dir === 2 ? cx + 21 : cx + 11;
          ctx.fillStyle = ent.armor;
          ctx.fillRect(ghx, cy + 7 + bobY, 8, 8);
          // Curled Horns
          ctx.fillStyle = ent.weapon;
          ctx.fillRect(ghx + 1, cy + 3 + bobY, 3, 4);
          ctx.fillRect(ghx + 5, cy + 3 + bobY, 3, 4);
        } else if (ent.name === 'Giant Rat') {
          // Rat Low Body
          ctx.fillStyle = ent.skin;
          ctx.fillRect(cx + 7, cy + 16 + bobY, 17, 8);
          // Pointed Snout
          const rhx = dir === 1 ? cx + 2 : dir === 2 ? cx + 22 : cx + 11;
          ctx.fillStyle = ent.armor;
          ctx.fillRect(rhx, cy + 14 + bobY, 8, 6);
          // Red Glowing Eyes
          ctx.fillStyle = ent.weapon;
          ctx.fillRect(rhx + (dir === 1 ? 2 : dir === 2 ? 5 : 3), cy + 15 + bobY, 2, 2);
          // Thin Tail
          ctx.fillStyle = ent.cape;
          ctx.fillRect(cx + 4, cy + 18 + bobY, 4, 2);
          // Feet
          ctx.fillRect(cx + 9, cy + 24 + bobY, 3, 3 + armSwing);
          ctx.fillRect(cx + 17, cy + 24 + bobY, 3, 3 - armSwing);
        } else if (ent.name === 'Wild Bear') {
          // Massive Bear Body
          ctx.fillStyle = ent.skin;
          ctx.fillRect(cx + 5, cy + 10 + bobY, 22, 14);
          // Heavy Paws
          ctx.fillStyle = ent.cape;
          ctx.fillRect(cx + 7, cy + 24 + bobY, 5, 6 + armSwing);
          ctx.fillRect(cx + 14, cy + 24 + bobY, 4, 6 - armSwing);
          ctx.fillRect(cx + 20, cy + 24 + bobY, 5, 6 + armSwing);
          // Broad Head & Rounded Ears
          const brhx = dir === 1 ? cx + 1 : dir === 2 ? cx + 22 : cx + 9;
          ctx.fillStyle = ent.armor;
          ctx.fillRect(brhx, cy + 8 + bobY, 12, 10);
          ctx.fillRect(brhx + 1, cy + 5 + bobY, 3, 3);
          ctx.fillRect(brhx + 8, cy + 5 + bobY, 3, 3);
        } else if (ent.name === 'Desert Camel') {
          // Camel Body & Hump
          ctx.fillStyle = ent.skin;
          ctx.fillRect(cx + 6, cy + 12 + bobY, 20, 10);
          // Hump
          ctx.fillStyle = ent.armor;
          ctx.fillRect(cx + 13, cy + 7 + bobY, 7, 6);
          // Long Neck & Head
          const chx = dir === 1 ? cx + 2 : dir === 2 ? cx + 22 : cx + 10;
          ctx.fillStyle = ent.skin;
          ctx.fillRect(chx, cy + 4 + bobY, 7, 10);
          // Long Sturdy Legs
          ctx.fillStyle = ent.cape;
          ctx.fillRect(cx + 8, cy + 22 + bobY, 3, 8 + armSwing);
          ctx.fillRect(cx + 14, cy + 22 + bobY, 3, 8 - armSwing);
          ctx.fillRect(cx + 20, cy + 22 + bobY, 3, 8 + armSwing);
        } else {
          // Humanoid Character
          // Head
          ctx.fillStyle = ent.skin;
          ctx.fillRect(cx + 11, cy + 4 + bobY, 10, 8);

          // Helmet / Hair
          ctx.fillStyle = ent.armor;
          ctx.fillRect(cx + 10, cy + 2 + bobY, 12, 4);

          // Eyes (with subtle blink during idle frame 2)
          if (dir !== 3) {
            const isBlink = (col === 2 && animPhase === 2);
            ctx.fillStyle = isBlink ? ent.skin : '#0f172a';
            const eyeX = dir === 1 ? 12 : dir === 2 ? 17 : 13;
            ctx.fillRect(cx + eyeX, cy + 7 + bobY, 2, isBlink ? 1 : 2);
            if (dir === 0) ctx.fillRect(cx + eyeX + 4, cy + 7 + bobY, 2, isBlink ? 1 : 2);
          }

          // Torso & Cuirass
          ctx.fillStyle = ent.armor;
          ctx.fillRect(cx + 9, cy + 12 + bobY, 14, 10);

          // Legs
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(cx + 10 + armSwing, cy + 22, 4, 7);
          ctx.fillRect(cx + 18 - armSwing, cy + 22, 4, 7);

          if (ent.name === 'Town Guard') {
            // Town Guard: Golden plume, Royal Crimson Tabard with cross, heater shield & halberd
            ctx.fillStyle = '#eab308'; // Gold plume
            ctx.fillRect(cx + 14, cy + 0 + bobY, 4, 3);
            ctx.fillStyle = ent.cape; // Crimson tabard
            ctx.fillRect(cx + 12, cy + 13 + bobY, 8, 8);
            ctx.fillStyle = '#eab308'; // Cross trim
            ctx.fillRect(cx + 15, cy + 13 + bobY, 2, 8);
            ctx.fillRect(cx + 12, cy + 16 + bobY, 8, 2);

            // Heater Shield on off-hand
            const shieldX = dir === 1 ? cx + 21 : cx + 3;
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(shieldX, cy + 11 + bobY, 6, 12);
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(shieldX + 1, cy + 12 + bobY, 4, 10);
            ctx.fillStyle = '#eab308';
            ctx.fillRect(shieldX + 2, cy + 15 + bobY, 2, 4);

            // Halberd / Guard Spear
            const spearX = dir === 1 ? cx + 3 : cx + 25;
            if (col >= 8 && col <= 11) {
              // Thrust forward
              ctx.fillStyle = '#713f12';
              ctx.fillRect(cx + (dir === 1 ? 0 : 20), cy + 14 + bobY, 12, 2);
              ctx.fillStyle = '#cbd5e1';
              ctx.fillRect(cx + (dir === 1 ? 0 : 28), cy + 12 + bobY, 4, 6);
            } else {
              ctx.fillStyle = '#713f12';
              ctx.fillRect(spearX, cy + 1 + bobY, 2, 24);
              ctx.fillStyle = '#cbd5e1';
              ctx.fillRect(spearX - 1, cy + 0 + bobY, 4, 5);
              ctx.fillStyle = '#eab308';
              ctx.fillRect(spearX + 2, cy + 2 + bobY, 2, 3);
            }
          } else {
            // Standard Weapon in hand
            ctx.fillStyle = ent.weapon;
            if (col >= 8 && col <= 11) {
              // Slashing weapon out
              ctx.fillRect(cx + (dir === 1 ? 2 : 24), cy + 10 + bobY, 6, 2);
              ctx.fillRect(cx + (dir === 1 ? 4 : 26), cy + 6 + bobY, 2, 10);
            } else {
              ctx.fillRect(cx + (dir === 1 ? 4 : 24), cy + 14 + bobY, 2, 8);
            }
          }
        }
      }
    }
  }

  return canvas;
}
