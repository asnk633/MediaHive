const fs = require('fs');

const raw = fs.readFileSync('errors.log', 'utf8');
const lines = raw.split('\n');

const cleaned = lines.filter(l => l.includes('error TS')).map(l => l.trim());

fs.writeFileSync('errors.json', JSON.stringify({ errors: cleaned }, null, 2));
console.log("Wrote " + cleaned.length + " errors to errors.json");
