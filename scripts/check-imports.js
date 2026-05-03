const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("Checking for broken or legacy imports...");

// Legacy imports to check for
const forbiddenPatterns = [
    "from '@/utils/navigation'",
    "from '@/api/",
    "from '@/types/task'",
    "from '@/types/event'",
    "from '@/types/campaign'",
    "from '@/services/taskService'",
    "from '@/services/campaignService'",
    "from '@/services/inventoryService'",
    "from '@/services/inventoryRequestService'",
    "from '@/services/events'",
    "from '@/services/taskRatingService'",
    "from '@/services/systemEventService'",
    "from '@/lib/server-utils'"
];

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
let errors = 0;

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of forbiddenPatterns) {
        if (content.includes(pattern)) {
            console.error(`❌ Found legacy/broken import in ${file}: ${pattern}`);
            errors++;
        }
    }
}

if (errors > 0) {
    console.error(`\n🚨 Import check failed! Found ${errors} violations.`);
    process.exit(1);
} else {
    console.log("✅ All imports look good.");
}
