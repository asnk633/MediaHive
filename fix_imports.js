const fs = require('fs');
const path = require('path');

const replacements = {
    "@/types/task": "@/features/tasks/types/task",
    "@/types/event": "@/features/events/types/event",
    "@/types/systemEvent": "@/features/events/types/systemEvent",
    "@/types/campaign": "@/features/campaigns/types/campaign",
    "@/services/taskService": "@/features/tasks/services/taskService", // Added proactively
    "@/services/campaignService": "@/features/campaigns/services/campaignService",
    "@/services/systemEventService": "@/features/events/services/systemEventService",
    "@/services/taskRatingService": "@/features/tasks/services/taskRatingService",
    "@/services/inventoryService": "@/services/inventory/inventoryService",
    "@/services/inventoryRequestService": "@/services/inventory/inventoryRequestService",
    "@/services/events": "@/features/events/services/eventService",
    "@/lib/server-utils": "@/lib/server/server-utils",
    "../../../../_lib/auth": "@/lib/server/server-utils" // from route.ts
};

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = walk('./src');
let changedFiles = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    for (const [oldImport, newImport] of Object.entries(replacements)) {
        // Regex to match the exact import string inside quotes
        const regex1 = new RegExp(`from ['"]${oldImport}['"]`, 'g');
        content = content.replace(regex1, `from '${newImport}'`);

        // Also dynamic imports
        const regex2 = new RegExp(`import\\(['"]${oldImport}['"]\\)`, 'g');
        content = content.replace(regex2, `import('${newImport}')`);
    }

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log(`Updated imports in ${file}`);
    }
}
console.log(`Done. Changed ${changedFiles} files.`);
