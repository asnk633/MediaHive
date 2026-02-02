
const fs = require('fs');
const path = require('path');

const walk = (dir, callback) => {
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
            walk(filepath, callback);
        } else if (stats.isFile() && file === 'route.ts') {
            callback(filepath);
        }
    });
};

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
let modifiedCount = 0;

walk(apiDir, (filepath) => {
    let content = fs.readFileSync(filepath, 'utf8');

    if (content.includes("export const dynamic = 'force-dynamic'")) {
        console.log(`Skipping (already dynamic): ${filepath}`);
        return;
    }

    if (content.includes("export const dynamic = 'force-static'")) {
        console.warn(`WARNING: Found force-static in ${filepath}. Replacing...`);
        content = content.replace(/export const dynamic = 'force-static';?/g, "export const dynamic = 'force-dynamic';");
        fs.writeFileSync(filepath, content);
        modifiedCount++;
        return;
    }

    // Insert after imports
    // Regex to find the end of the last import statement
    const lastImportMatch = content.match(/import.*;\s*/g);

    if (lastImportMatch) {
        // Find the last index of 'import' or 'require' or simple naive split
        const parts = content.split(/^(import .*?from.*?;)/gm);
        // This split is tricky. Let's just prepend before the first 'export function' or 'export async function'

        const exportMatch = content.match(/export (async )?function (GET|POST|PUT|DELETE|PATCH)/);
        if (exportMatch) {
            const idx = exportMatch.index;
            const newContent = content.slice(0, idx) + "\nexport const dynamic = 'force-dynamic';\n\n" + content.slice(idx);
            fs.writeFileSync(filepath, newContent);
            console.log(`Updated: ${filepath}`);
            modifiedCount++;
        } else {
            console.log(`Skipping (no route handler found): ${filepath}`);
        }
    } else {
        // Fallback: prepend to top
        console.warn(`Warning: No imports found in ${filepath}, prepending...`);
        const newContent = "export const dynamic = 'force-dynamic';\n\n" + content;
        fs.writeFileSync(filepath, newContent);
        modifiedCount++;
    }
});

console.log(`Done. Modified ${modifiedCount} files.`);
