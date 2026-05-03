const { exec } = require('child_process');
const fs = require('fs');

console.log('Running tsc --noEmit...');
exec('npx tsc --noEmit', (error, stdout, stderr) => {
    const output = stdout + '\n' + stderr;
    const lines = output.split('\n');
    const errors = lines.filter(line => line.includes('error TS')).map(line => line.trim());

    const result = {
        totalErrors: errors.length,
        errors: errors,
        raw: output.length > 50000 ? output.substring(0, 50000) + '...[truncated]' : output
    };

    fs.writeFileSync('errors.json', JSON.stringify(result, null, 2));
    console.log(`Wrote ${errors.length} errors to errors.json`);
});
