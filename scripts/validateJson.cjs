/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../src/data');
console.log('🔍 Validating all JSON catalog files in src/data...');

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
let hasError = false;
let validatedCount = 0;

for (const file of files) {
  const filePath = path.join(dataDir, file);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      console.error(`❌ ${file}: Root must be an object or array`);
      hasError = true;
    } else {
      validatedCount++;
    }
  } catch (err) {
    console.error(`❌ ${file}: Invalid JSON syntax -`, err.message);
    hasError = true;
  }
}

if (hasError) {
  console.error(`❌ JSON validation failed with errors.`);
  process.exit(1);
} else {
  console.log(`✅ Successfully validated ${validatedCount} JSON catalog files!`);
}
