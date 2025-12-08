// fix-imports.js
// Run with: node scripts/fix-imports.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // skip node_modules and .git
            if (['node_modules', '.git'].includes(entry.name)) continue;
            walk(full);
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
            let content = fs.readFileSync(full, 'utf8');
            const original = content;
            // Replace relative imports to rbac with absolute alias
            content = content.replace(/from\s+['"](\.\.\/|\.\.\/\.\.\/|\.\.\/\.\.\/\.\.\/|\.\.\/\.\.\/\.\.\/\.\.\/)?_lib\/rbac['"]/g,
                "from '@/app/api/_lib/rbac'");
            // Replace relative imports to rbac.test or rbac-integration if any (not needed)
            // Replace hasRole/hasPermission imports from rbac with from '@/app/api/_lib/rbac'
            content = content.replace(/import\s+\{\s*([^}]*?)\s*\}\s+from\s+['"]\.\.\/\.\.\/\.\.\/_lib\/rbac['"]/g,
                (m, p1) => `import { ${p1} } from '@/app/api/_lib/rbac'`);
            if (content !== original) {
                fs.writeFileSync(full, content, 'utf8');
                console.log('Fixed imports in', path.relative(root, full));
            }
        }
    }
}
walk(root);
console.log('Import fixing completed.');
