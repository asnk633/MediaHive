const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath, filelist);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            filelist.push(fullPath);
        }
    }
    return filelist;
}

const apiFiles = walk('d:/MediaHive App/src/app/api');
let fixedCount = 0;

for (const file of apiFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let dirty = false;

    // standardize getMockDbServices / getMOCK_KEYServices -> getSupabaseServerServices
    if (content.includes('getMockDbServices')) {
        content = content.replace(/getMockDbServices/g, 'getSupabaseServerServices');
        dirty = true;
    }
    if (content.includes('getMOCK_KEYServices')) {
        content = content.replace(/getMOCK_KEYServices/g, 'getSupabaseServerServices');
        dirty = true;
    }

    const needsVerify = content.includes('verifyUser') && !content.includes('export async function verifyUser') && !content.includes('import { verifyUser');
    const needsSupabase = content.includes('getSupabaseServerServices') && !content.includes('export async function getSupabaseServerServices') && !content.includes('import { getSupabaseServerServices');

    if (needsVerify || needsSupabase) {
        const match = content.match(/import\s+{([^}]+)}\s+from\s+['\"]@\/lib\/server-utils['\"]/);

        let existingImports = [];
        if (match) {
            existingImports = match[1].split(',').map(s => s.trim()).filter(Boolean);
        }

        if (needsVerify && !existingImports.includes('verifyUser')) existingImports.push('verifyUser');
        if (needsSupabase && !existingImports.includes('getSupabaseServerServices')) existingImports.push('getSupabaseServerServices');

        if (match) {
            const newImportStmt = `import { ${Array.from(new Set(existingImports)).join(', ')} } from '@/lib/server-utils';`;
            content = content.replace(match[0], newImportStmt);
        } else {
            const newImportStmt = `import { ${Array.from(new Set(existingImports)).join(', ')} } from '@/lib/server-utils';`;
            // Insert after first line if it's a pragma, else top
            let lines = content.split('\n');
            let insertIdx = 0;
            if (lines[0] && lines[0].includes('ts-nocheck')) {
                insertIdx = 1;
            }
            lines.splice(insertIdx, 0, newImportStmt);
            content = lines.join('\n');
        }
        dirty = true;
    }

    if (dirty) {
        fs.writeFileSync(file, content);
        fixedCount++;
        console.log('Fixed imports in', path.relative('d:/MediaHive App', file));
    }
}
console.log('Total files fixed:', fixedCount);
