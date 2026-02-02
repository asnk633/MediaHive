// Validation script to ensure all required assets exist before Android build
const fs = require('fs');
const path = require('path');

const assetsBasePath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public');
const wwwDir = path.join(__dirname, '..', 'out');

const validationChecks = [
    {
        name: 'Static export directory exists',
        check: () => fs.existsSync(wwwDir),
        error: 'Static export directory does not exist. Did you run "npm run build" first?'
    },
    {
        name: 'Index HTML file exists',
        check: () => fs.existsSync(path.join(wwwDir, 'index.html')),
        error: 'index.html missing from static export'
    },
    {
        name: 'Home page exists',
        check: () => fs.existsSync(path.join(wwwDir, 'home', 'index.html')),
        error: 'home/index.html missing from static export'
    },
    {
        name: '_next directory exists',
        check: () => fs.existsSync(path.join(wwwDir, '_next')),
        error: '_next directory missing from static export'
    },
    {
        name: 'Android assets directory exists',
        check: () => fs.existsSync(assetsBasePath),
        error: 'Android assets directory does not exist'
    },
    {
        name: 'Plugins directory exists',
        check: () => fs.existsSync(path.join(assetsBasePath, 'plugins')),
        error: 'plugins directory missing in Android assets'
    },
    {
        name: 'Plugins .keep file exists',
        check: () => fs.existsSync(path.join(assetsBasePath, 'plugins', '.keep')),
        error: 'plugins/.keep file missing in Android assets'
    }
];

let allValid = true;

console.log('Running asset validation checks...\n');

for (const check of validationChecks) {
    try {
        const isValid = check.check();
        if (isValid) {
            console.log(`✓ ${check.name}`);
        } else {
            console.error(`✗ ${check.name}`);
            console.error(`  Error: ${check.error}`);
            allValid = false;
        }
    } catch (error) {
        console.error(`✗ ${check.name}`);
        console.error(`  Error: ${error.message}`);
        allValid = false;
    }
}

if (!allValid) {
    console.error('\nAsset validation FAILED. Build will exit with error.');
    process.exit(1);
} else {
    console.log('\n✓ All asset validation checks PASSED.');
    console.log('Build can proceed safely.');
}

// Additional check: verify key mobile routes exist
const mobileRoutes = [
    'tasks/index.html',
    'events/index.html', 
    'downloads/index.html',
    'admin/index.html',
    'activity/index.html'
];

console.log('\nChecking mobile route availability...');
for (const route of mobileRoutes) {
    const routePath = path.join(wwwDir, route);
    if (fs.existsSync(routePath)) {
        console.log(`✓ Mobile route available: /${route}`);
    } else {
        console.warn(`⚠ Mobile route missing: /${route} (may not be required)`);
    }
}

console.log('\nAsset validation completed successfully!');