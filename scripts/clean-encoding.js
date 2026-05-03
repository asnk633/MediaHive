const fs = require('fs');
const path = require('path');

const dir = 'd:/MediaHive App/src/components/flowboard';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Remove BOM (Byte Order Mark) if present
    content = content.replace(/^\uFEFF/g, '');

    // Remove null bytes and other common binary corruptions
    content = content.replace(/\0/g, '');

    // Attempt to convert UTF-16 representation (every other char is null or space-ish if misinterpreted)
    // Actually, simply rewriting it via utf8 usually handles it if we strip weird bytes, but let's just do a clean rewrite.
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Cleaned ${file}`);
}
