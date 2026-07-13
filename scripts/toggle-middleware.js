const fs = require('fs');
const path = require('path');

const middlewarePath = path.join(__dirname, '..', 'src', 'middleware.ts');
const disabledPath = path.join(__dirname, '..', 'src', 'middleware.ts.disabled');

const action = process.argv[2]; // 'disable' or 'enable'

if (action === 'disable') {
    if (fs.existsSync(middlewarePath)) {
        console.log('Disabling middleware for mobile build...');
        fs.renameSync(middlewarePath, disabledPath);
    } else {
        console.log('Middleware already disabled or missing.');
    }
} else if (action === 'enable') {
    if (fs.existsSync(disabledPath)) {
        console.log('Restoring middleware...');
        fs.renameSync(disabledPath, middlewarePath);
    } else {
        console.log('Middleware backup not found, skipping restore.');
    }
} else {
    console.error('Usage: node toggle-middleware.js [disable|enable]');
    process.exit(1);
}
