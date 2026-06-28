const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git' && file !== 'mediahive_mobile' && file !== '.agent') {
        search(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('[key: string]') || content.includes('[key:number]') || content.includes('[key: Record')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('[key:') || line.includes('Record<string')) {
            console.log(`${fullPath}:${idx+1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

search('.');
