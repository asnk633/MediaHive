const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        search(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('interface Notification') || content.includes('type Notification') || content.includes('Notification =')) {
        console.log(`Found Notification definition in: ${fullPath}`);
        // print lines matching the definition
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('Notification') && (line.includes('interface') || line.includes('type'))) {
            console.log(`  Line ${idx+1}: ${line}`);
          }
        });
      }
    }
  }
}

search('./src');
