#!/usr/bin/env node
// tools/replace_seed_calls.js (CommonJS) - supports --root <path>
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const dryRun = !apply;
const rootArgIndex = args.indexOf("--root");
const root = rootArgIndex !== -1 && args[rootArgIndex + 1] ? path.resolve(process.cwd(), args[rootArgIndex + 1]) : process.cwd();

function findTestsDirs(base) {
  // find all directories named __tests__ under base
  const results = [];
  function walk(dir) {
    const list = fs.readdirSync(dir);
    for (const name of list) {
      const full = path.join(dir, name);
      try {
        const st = fs.statSync(full);
        if (st.isDirectory()) {
          if (name === "__tests__") {
            results.push(full);
          } else {
            walk(full);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }
  walk(base);
  return results;
}

function findTestFiles(testsDir) {
  const out = [];
  if (!fs.existsSync(testsDir)) return out;
  const items = fs.readdirSync(testsDir);
  for (const it of items) {
    const full = path.join(testsDir, it);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      out.push(...findTestFiles(full));
    } else if (st.isFile() && (full.endsWith(".ts") || full.endsWith(".tsx") || full.endsWith(".js"))) {
      out.push(full);
    }
  }
  return out;
}

// Regex: matches single-line awaits like:
// await adminDb.collection("roles").doc("alice").set({ role: "admin", tags: [] });
const roleSetRegex = /await\s+([a-zA-Z0-9_]+)\.collection\(\s*["']roles["']\s*\)\.doc\(\s*["']([^"']+)["']\s*\)\.set\(\s*\{\s*role\s*:\s*["']([^"']+)["'](?:\s*,\s*tags\s*:\s*\[([^\]]*)\])?\s*\}\s*\)\s*;?/g;

function makeSeedCall(dbVar, entries) {
  const pairs = entries.map(e => {
    return `${JSON.stringify(e.uid)}: { role: ${JSON.stringify(e.role)} }`;
  });
  return `await seedRoles(${dbVar}, { ${pairs.join(", ")} });`;
}

function ensureImport(content, relImport) {
  if (content.includes("seedRoles")) {
    if (content.match(/import\s+\{\s*seedRoles\s*\}\s+from\s+['"][^'"]+['"]/) ||
        content.match(/const\s+\{\s*seedRoles\s*\}\s*=\s*require\(['"][^'"]+['"]\)/)) return content;
  }
  // insert a CommonJS require after existing imports or at top
  const importRegex = /(^import[^\n]*\n)+/m;
  const m = content.match(importRegex);
  const requireLine = `const { seedRoles } = require("${relImport}");\n`;
  if (m) {
    const insertPos = m.index + m[0].length;
    return content.slice(0, insertPos) + requireLine + content.slice(insertPos);
  } else {
    return requireLine + content;
  }
}

function relativeImportPath(fromFile) {
  const fromDir = path.dirname(fromFile);
  const rel = path.relative(fromDir, path.join(root, "src", "test", "firestoreTestUtils"));
  let importPath = rel.replace(/\\/g, "/");
  if (!importPath.startsWith(".")) importPath = "./" + importPath;
  return importPath;
}

console.log("replace_seed_calls: root =", root);
const testDirs = findTestsDirs(root);
if (testDirs.length === 0) {
  console.log("No __tests__ directories found under", root);
  process.exit(0);
}

let allFiles = [];
for (const d of testDirs) {
  allFiles.push(...findTestFiles(d));
}

if (allFiles.length === 0) {
  console.log("No test files (ts/tsx/js) found in discovered __tests__ directories.");
  process.exit(0);
}

const edits = [];

for (const file of allFiles) {
  let content = fs.readFileSync(file, "utf8");
  let match;
  const groups = {}; // dbVar => [{uid,role,fullMatch, index}]
  while ((match = roleSetRegex.exec(content)) !== null) {
    const dbVar = match[1];
    const uid = match[2];
    const role = match[3];
    const full = match[0];
    const idx = match.index;
    if (!groups[dbVar]) groups[dbVar] = [];
    groups[dbVar].push({ uid, role, full, idx });
  }

  if (Object.keys(groups).length === 0) continue;

  let newContent = content;
  const dbVarsSorted = Object.keys(groups).sort((a, b) => {
    return groups[b][0].idx - groups[a][0].idx;
  });

  for (const dbVar of dbVarsSorted) {
    const entries = groups[dbVar].map(x => ({ uid: x.uid, role: x.role }));
    const seedCall = makeSeedCall(dbVar, entries);
    // remove all matched full strings for this dbVar from content
    for (const g of groups[dbVar]) {
      newContent = newContent.replace(g.full, "");
    }
    // insert seedCall near first match location
    const insertIdx = groups[dbVar][0].idx;
    const before = content.slice(0, insertIdx);
    const lineStart = before.lastIndexOf("\n") + 1;
    const snippet = content.slice(0, lineStart + 200);
    const idxInNew = newContent.indexOf(snippet);
    let insertPos = lineStart;
    if (idxInNew !== -1) {
      insertPos = idxInNew + snippet.length;
    } else {
      insertPos = 0;
    }
    const seedLine = seedCall + "\n";
    newContent = newContent.slice(0, insertPos) + seedLine + newContent.slice(insertPos);
  }

  if (newContent.includes("seedRoles")) {
    const relImport = relativeImportPath(file);
    if (!newContent.match(/import\s+\{\s*seedRoles\s*\}\s+from\s+['"][^'"]+['"]/) &&
        !newContent.match(/const\s+\{\s*seedRoles\s*\}\s*=\s*require\(['"][^'"]+['"]\)/)) {
      newContent = ensureImport(newContent, relImport);
    }
  }

  if (newContent !== content) {
    edits.push({ file, old: content, new: newContent });
  }
}

if (edits.length === 0) {
  console.log("No role set() patterns found for replacement.");
  process.exit(0);
}

console.log(`Found ${edits.length} files with role seed patterns to replace.`);

for (const e of edits) {
  console.log("\n---");
  console.log("File:", e.file);
  if (dryRun) {
    console.log("----- Preview replacement (top 800 chars of new content) -----");
    console.log(e.new.slice(0, 800));
  } else {
    const bak = e.file + ".bak";
    if (!fs.existsSync(bak)) {
      fs.writeFileSync(bak, e.old, "utf8");
      console.log("Created backup:", bak);
    }
    fs.writeFileSync(e.file, e.new, "utf8");
    console.log("Patched:", e.file);
  }
}

if (dryRun) {
  console.log("\nDry run complete. Rerun with --apply to write changes and create .bak backups.");
} else {
  console.log("\nApply complete. Backups saved as *.bak.");
}
