const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== '.next' && file !== '.git' && file !== 'mediahive_mobile' && file !== '.agent') {
        search(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.d.ts')) {
      if (fullPath.includes('node_modules') && !fullPath.includes('@types') && !fullPath.includes('mediahive')) {
        continue; // skip most of node_modules to save speed, but keep @types
      }
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('isRead') && content.includes('userId')) {
          console.log(`Found BOTH isRead and userId in: ${fullPath}`);
        }
      } catch (e) {}
    }
  }
}

search('.');
