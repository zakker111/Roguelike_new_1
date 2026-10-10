/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../src/data');

console.log('═══════════════════════════════════════════════════════════════════');
console.log('       ROGUELIKE CONTENT VALIDATION & INTEGRITY AUDITOR');
console.log('═══════════════════════════════════════════════════════════════════\n');

function loadJson(filename) {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const errors = [];
const warnings = [];

// 1. Enemies
const enemies = loadJson('enemies.json');
const enemyIds = new Set();
if (enemies) {
  for (const [id, def] of Object.entries(enemies)) {
    if (enemyIds.has(id)) {
      errors.push(`[ENEMIES] Duplicate enemy ID "${id}"`);
    }
    enemyIds.add(id);

    if (!def.name) errors.push(`[ENEMIES] Enemy "${id}" missing name`);
    if (def.baseHp === undefined || def.baseHp <= 0) errors.push(`[ENEMIES] Enemy "${id}" invalid baseHp (${def.baseHp})`);
    if (def.baseAtk === undefined || def.baseAtk < 0) errors.push(`[ENEMIES] Enemy "${id}" invalid baseAtk (${def.baseAtk})`);
    if (def.speed === undefined || def.speed <= 0) errors.push(`[ENEMIES] Enemy "${id}" invalid speed (${def.speed})`);
    if (def.range === undefined || def.range < 1) errors.push(`[ENEMIES] Enemy "${id}" invalid range (${def.range})`);
  }
  console.log(`✅ Enemies: ${enemyIds.size} validated.`);
}

// 2. Materials & Items
const materials = loadJson('materials.json');
const catalysts = loadJson('catalysts.json');
const relics = loadJson('relics.json');
const scrolls = loadJson('spellScrolls.json');
const itemIds = new Set();

function validateItemArray(arr, category) {
  if (!arr || !Array.isArray(arr)) return;
  for (const item of arr) {
    if (itemIds.has(item.id)) {
      errors.push(`[ITEMS] Duplicate item ID "${item.id}" in ${category}`);
    }
    itemIds.add(item.id);
    if (!item.name) errors.push(`[ITEMS] Item "${item.id}" missing name`);
  }
}

validateItemArray(materials, 'materials');
validateItemArray(catalysts, 'catalysts');
validateItemArray(relics, 'relics');
validateItemArray(scrolls, 'spellScrolls');
console.log(`✅ Items & Catalogs: ${itemIds.size} validated.`);

// 3. Weapons
const weapons = loadJson('weaponTemplates.json');
const weaponTypes = new Set();
if (weapons) {
  for (const [baseType, def] of Object.entries(weapons)) {
    if (weaponTypes.has(baseType)) {
      errors.push(`[WEAPONS] Duplicate weapon baseType "${baseType}"`);
    }
    weaponTypes.add(baseType);
    if (!def.name) errors.push(`[WEAPONS] Weapon "${baseType}" missing name`);
    if (def.baseDamage <= 0) errors.push(`[WEAPONS] Weapon "${baseType}" invalid baseDamage`);
    if (def.range < 1) errors.push(`[WEAPONS] Weapon "${baseType}" invalid range`);
  }
  console.log(`✅ Weapons: ${weaponTypes.size} validated.`);
}

// 4. Enemy drop references check
if (enemies) {
  for (const [id, def] of Object.entries(enemies)) {
    if (def.dropMaterials) {
      for (const mat of def.dropMaterials) {
        if (!itemIds.has(mat)) {
          warnings.push(`[DROPS] Enemy "${id}" drops uncatalogued material "${mat}"`);
        }
      }
    }
    if (def.dropCatalysts) {
      for (const cat of def.dropCatalysts) {
        if (!itemIds.has(cat)) {
          warnings.push(`[DROPS] Enemy "${id}" drops uncatalogued catalyst "${cat}"`);
        }
      }
    }
  }
}

console.log('\n───────────────────────────────────────────────────────────────────');
if (errors.length === 0) {
  console.log(`🎉 VALIDATION PASSED: 0 errors, ${warnings.length} warnings.`);
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(w => console.log('  ' + w));
  }
  console.log('───────────────────────────────────────────────────────────────────\n');
  process.exit(0);
} else {
  console.error(`❌ VALIDATION FAILED: ${errors.length} fatal errors detected!\n`);
  errors.forEach(e => console.error('  🚨 ' + e));
  console.log('───────────────────────────────────────────────────────────────────\n');
  process.exit(1);
}
