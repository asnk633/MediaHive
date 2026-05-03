const fs = require('fs');

try {
    const tscOut = fs.readFileSync('tsc.txt', 'utf8');
    const lines = tscOut.split('\n');
    const errors = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('error TS2307: Cannot find module')) {
            // Find the file reference before it
            let j = i - 1;
            while (j >= 0 && !lines[j].includes('(')) {
                j--;
            }
            errors.push(lines[j]?.trim() + " -> " + lines[i].trim());
        }
    }
    fs.writeFileSync('errors.json', JSON.stringify(errors, null, 2));
    console.log("Extracted " + errors.length + " errors.");
} catch (e) { console.error(e); }
