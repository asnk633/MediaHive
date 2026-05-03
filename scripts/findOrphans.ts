import fs from 'fs';
import path from 'path';

const componentsDir = 'd:/MediaHive App/src/components';
const srcDir = 'd:/MediaHive App/src';

function getAllFiles(dir: string, extList: string[]): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(file, extList));
        } else {
            if (extList.some(ext => file.endsWith(ext))) {
                results.push(file);
            }
        }
    });
    return results;
}

const componentFiles = getAllFiles(componentsDir, ['.tsx', '.ts']);
const allSrcFiles = getAllFiles(srcDir, ['.tsx', '.ts']);

const orphanComponents: string[] = [];

componentFiles.forEach(compPath => {
    const compName = path.basename(compPath, path.extname(compPath));
    // Skip index files or common utility patterns
    if (compName === 'index') return;

    let isUsed = false;
    const searchString = compName;

    for (const srcPath of allSrcFiles) {
        if (srcPath === compPath) continue; // Don't match itself
        const content = fs.readFileSync(srcPath, 'utf8');
        if (content.includes(searchString)) {
            isUsed = true;
            break;
        }
    }

    if (!isUsed) {
        orphanComponents.push(path.relative(componentsDir, compPath));
    }
});

console.log('--- ORPHAN COMPONENTS REPORT ---');
if (orphanComponents.length === 0) {
    console.log('No orphaned components found.');
} else {
    orphanComponents.forEach(c => console.log(c));
}
