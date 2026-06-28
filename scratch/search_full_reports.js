const fs = require('fs');
const content = fs.readFileSync('src/app/(shell)/reports/ReportsClient.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('formattedUsers') || line.includes('u.id')) {
    console.log(`Line ${index + 1}: ${line}`);
  }
});
