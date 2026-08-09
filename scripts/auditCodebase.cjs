const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Comprehensive Codebase & Import Audit...\n');

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
console.log(`📁 Scanned ${allFiles.length} total source files in src/`);

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

// 2. Relative Import Resolution Audit
const tsFiles = allFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
console.log(`\n🔗 Auditing relative imports across ${tsFiles.length} TypeScript source files...`);

const importRegex = /from\s+[\x27\x22]([^\x27\x22]+)[\x27\x22]/g;
const dynamicImportRegex = /import\([\x27\x22]([^\x27\x22]+)[\x27\x22]\)/g;

tsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  const checkImport = (imp) => {
    if (!imp.startsWith('.')) return; // skip package imports
    const dir = path.dirname(file);
    const resolved = path.resolve(dir, imp);
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

if (errorCount === 0) {
  console.log('\n✅ Codebase import and JSON audit passed with 0 errors!');
} else {
  console.error(`\n❌ Found ${errorCount} errors during codebase audit.`);
  process.exit(1);
}
