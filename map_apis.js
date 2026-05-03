const fs = require('fs');
const path = require('path');

const srcAppDir = path.join(__dirname, 'src', 'app');

function getAllPages(dir, result = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === '(auth)') continue; // Skip auth folder if needed, but let's actually just read everything
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllPages(fullPath, result);
        } else if (file === 'page.tsx' || file === 'page.jsx') {
            result.push(fullPath);
        }
    }
    return result;
}

const pages = getAllPages(srcAppDir);
const report = {};

const apiRegex = /(?:apiClient|fetch)\(['"`](.+?)['"`]/g;

for (const page of pages) {
    const content = fs.readFileSync(page, 'utf-8');
    const relativePath = path.relative(srcAppDir, page);
    let match;
    const apis = new Set();
    while ((match = apiRegex.exec(content)) !== null) {
        apis.add(match[1]);
    }

    // Also look for service layer calls superficially
    const serviceRegex = /([A-Za-z0-9]+Service)\.([A-Za-z0-9]+)\(/g;
    while ((match = serviceRegex.exec(content)) !== null) {
        apis.add(`Service: ${match[1]}.${match[2]}`);
    }

    if (apis.size > 0) {
        report[relativePath] = Array.from(apis);
    }
}

fs.writeFileSync('api_map_report.json', JSON.stringify(report, null, 2));
console.log('Generated api_map_report.json for ' + Object.keys(report).length + ' pages');
