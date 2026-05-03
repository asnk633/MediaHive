const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /@\/types\/task['"]/g, to: (match) => match.replace('@/types/task', '@/features/tasks/types/task') },
    { from: /@\/types\/event['"]/g, to: (match) => match.replace('@/types/event', '@/features/events/types/event') },
    { from: /@\/types\/campaign['"]/g, to: (match) => match.replace('@/types/campaign', '@/features/campaigns/types/campaign') },
    { from: /@\/types\/systemEvent['"]/g, to: (match) => match.replace('@/types/systemEvent', '@/features/events/types/systemEvent') },
    { from: /@\/utils\/navigation['"]/g, to: (match) => match.replace('@/utils/navigation', '@/lib/utils') },
];

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
            let changed = false;
            for (const r of replacements) {
                if (r.from.test(content)) {
                    content = content.replace(r.from, r.to);
                    changed = true;
                }
            }
            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

const targetDir = path.join(process.cwd(), 'src');
console.log(`Scanning ${targetDir}...`);
walk(targetDir);
console.log('Done.');
