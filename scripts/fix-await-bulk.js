const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /(const|let|var)\s+(\w+)\s*=\s*(getSupabaseFromRequest|getUserFromRequest|getSupabaseAdmin)\((request|req)\)(?!\s*;?\s*await)/g, to: '$1 $2 = await $3($4)' },
    // This regex matches "const supabase = getSupabaseFromRequest(request)" and adds "await"
    // It avoids double-awaiting if already present (though unlikely based on errors)
];

// More refined replacement for the specific error pattern
function refinedReplacement(content) {
    let changed = false;

    // Specific patterns seen in errors
    const patterns = [
        { from: /const\s+supabase\s*=\s*getSupabaseFromRequest\((request|req)\);/g, to: 'const supabase = await getSupabaseFromRequest($1);' },
        { from: /const\s+supabaseAdmin\s*=\s*getSupabaseAdmin\(\);/g, to: 'const supabaseAdmin = await getSupabaseAdmin();' },
        { from: /const\s+user\s*=\s*getUserFromRequest\((request|req)\);/g, to: 'const user = await getUserFromRequest($1);' }
    ];

    for (const p of patterns) {
        if (p.from.test(content)) {
            content = content.replace(p.from, p.to);
            changed = true;
        }
    }
    return { content, changed };
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
                walk(fullPath);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let { content: newContent, changed } = refinedReplacement(content);

            if (changed) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

const targetDir = path.join(process.cwd(), 'src/app/api');
console.log(`Scanning ${targetDir}...`);
walk(targetDir);
console.log('Done.');
