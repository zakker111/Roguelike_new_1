const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Comprehensive Codebase, JSON & Import Audit...\n');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.json')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = getAllFiles('./src');
console.log(`📁 Scanned ${allFiles.length} total source and data files in src/`);

let errorCount = 0;

// 1. JSON Validity Audit
const jsonFiles = allFiles.filter(f => f.endsWith('.json'));
console.log(`\n📊 Validating ${jsonFiles.length} JSON data catalog files...`);
jsonFiles.forEach(file => {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Invalid JSON syntax in ${file}:`, err.message);
    errorCount++;
  }
});

// 2. Relative Import Resolution Audit & Unreferenced File Detection
const tsFiles = allFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
console.log(`\n🔗 Auditing relative imports across ${tsFiles.length} TypeScript source files...`);

const importedPaths = new Set();
const importRegex = /from\s+[\x27\x22]([^\x27\x22]+)[\x27\x22]/g;
const dynamicImportRegex = /import\([\x27\x22]([^\x27\x22]+)[\x27\x22]\)/g;

tsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  const checkImport = (imp) => {
    if (!imp.startsWith('.')) return; // skip package imports
    const dir = path.dirname(file);
    const resolved = path.resolve(dir, imp);
    importedPaths.add(resolved);
    importedPaths.add(resolved + '.ts');
    importedPaths.add(resolved + '.tsx');
    importedPaths.add(resolved + '.json');
    importedPaths.add(path.join(resolved, 'index.ts'));
    importedPaths.add(path.join(resolved, 'index.tsx'));

    const candidateExtensions = ['', '.ts', '.tsx', '.json', '/index.ts', '/index.tsx'];
    let exists = false;
    for (const ext of candidateExtensions) {
      const fullPath = resolved + ext;
      if (fs.existsSync(fullPath) && !fs.statSync(fullPath).isDirectory()) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      console.error(`❌ Broken import in ${file}: cannot resolve "${imp}"`);
      errorCount++;
    }
  };

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    checkImport(match[1]);
  }
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    checkImport(match[1]);
  }
});

// 3. Check for unreferenced source files
console.log(`\n🔎 Checking for orphaned/dead source files...`);
const entryPoints = [
  path.resolve('./src/main.tsx'),
  path.resolve('./src/App.tsx'),
  path.resolve('./src/index.css'),
  path.resolve('./src/declarations.d.ts'),
  path.resolve('./src/types.ts'),
  path.resolve('./src/data/index.ts'),
  path.resolve('./src/utils/index.ts'),
  path.resolve('./src/components/index.ts')
];

const isEntryPointOrBarrel = (filePath) => {
  const abs = path.resolve(filePath);
  if (entryPoints.includes(abs)) return true;
  if (filePath.endsWith('/index.ts') || filePath.endsWith('/index.tsx')) return true;
  return false;
};

let orphaned = [];
allFiles.forEach(file => {
  const abs = path.resolve(file);
  if (isEntryPointOrBarrel(file)) return;
  if (file.includes('/tests/')) return; // test files are executed by test runner
  if (file.endsWith('.d.ts')) return;

  const isImported = Array.from(importedPaths).some(p => p === abs || p.replace(/\.[^/.]+$/, '') === abs.replace(/\.[^/.]+$/, ''));
  if (!isImported) {
    orphaned.push(file);
  }
});

if (orphaned.length > 0) {
  console.error(`❌ Found ${orphaned.length} unreferenced source files:`, orphaned);
  errorCount += orphaned.length;
} else {
  console.log('✅ All source and data files are modularly connected and verified!');
}

if (errorCount === 0) {
  console.log('\n✅ Codebase import, JSON catalogs, and file graph audit passed with 0 errors!\n');
} else {
  console.error(`\n❌ Found ${errorCount} errors during codebase audit.`);
  process.exit(1);
}
