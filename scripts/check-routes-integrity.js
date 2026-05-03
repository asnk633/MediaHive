const fs = require('fs');
const path = require('path');

function checkRoutes(dir) {
    const dirs = fs.readdirSync(dir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    // Exclude non-route directories
    const ignoreDirs = ['api', 'components', 'lib', 'hooks', 'types', 'services', 'utils'];

    for (const d of dirs) {
        if (d.startsWith('(') && d.endsWith(')')) {
            // It's a route group (e.g. (shell)), traverse inside
            checkRoutes(path.join(dir, d));
            continue;
        }

        if (ignoreDirs.includes(d) || d.startsWith('.')) continue;

        const fullPath = path.join(dir, d);
        checkRoutes(fullPath); // Recursive

        // After recursive check, see if this directory represents a route that should have a page.tsx
        // Next.js logic: If it doesn't contain a page.tsx, it's NOT a route, BUT sometimes people
        // create folders with just client components. The requirement is: "If a folder has only client components, create a thin wrapper page.tsx."
        // Let's identify folders that have .tsx files but NO page.tsx
        const files = fs.readdirSync(fullPath, { withFileTypes: true });

        let hasTsxFiles = false;
        let hasPageTsx = false;

        for (const file of files) {
            if (!file.isDirectory() && file.name.endsWith('.tsx')) {
                hasTsxFiles = true;
                if (file.name === 'page.tsx' || file.name === 'layout.tsx') {
                    hasPageTsx = true;
                }
            }
        }

        if (hasTsxFiles && !hasPageTsx) {
            // Found a folder with tsx components but no page.tsx/layout.tsx
            // It's likely a components folder. Let's see if it's named 'components' or inside one
            if (!fullPath.includes('components')) {
                console.log("⚠️ Potential missing page.tsx in ", fullPath);
                const tsxFiles = files.filter(f => !f.isDirectory() && f.name.endsWith('.tsx'));
                // If there's exactly one component that looks like a page (e.g., ends with Client, View), maybe it needs a wrapper
                tsxFiles.forEach(f => {
                    if (f.name.endsWith('Client.tsx') || f.name.endsWith('View.tsx')) {
                        console.log(`   👉 Found '${f.name}' which looks like a client page without a wrapper.`);
                        // CREATE THIN WRAPPER
                        const componentName = f.name.replace('.tsx', '');
                        const wrapperContent = `export { default } from './${componentName}';\n`;
                        fs.writeFileSync(path.join(fullPath, 'page.tsx'), wrapperContent);
                        console.log(`   ✅ Created page.tsx wrapper for ${f.name}`);
                    }
                })
            }
        }
    }
}

checkRoutes('src/app');
