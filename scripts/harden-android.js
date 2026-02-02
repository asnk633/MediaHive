// Enhanced harden-android.js script to ensure Capacitor Android assets are properly prepared
const fs = require('fs');
const path = require('path');

// Define asset paths
const wwwDir = path.join(__dirname, '..', 'out');
const assetsBasePath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public');
const wwwPluginsDir = path.join(wwwDir, 'plugins');
const assetsPluginsDir = path.join(assetsBasePath, 'plugins');

console.log('[HARDEN] Starting Android asset hardening process...');

// Validate that the static export directory exists
if (!fs.existsSync(wwwDir)) {
    console.error('[HARDEN] ERROR: Static export directory does not exist at:', wwwDir);
    console.error('[HARDEN] Did you run "npm run build" first?');
    process.exit(1);
}

// Validate that key files exist in the static export
const requiredFiles = [
    'index.html',
    'home/index.html',
    '_next'
];

for (const file of requiredFiles) {
    const filePath = path.join(wwwDir, file);
    if (!fs.existsSync(filePath)) {
        console.warn('[HARDEN] WARNING: Required file/directory missing:', filePath);
    }
}

console.log('[HARDEN] Validating Android assets directory structure...');

// Create plugins directory in both locations to ensure it persists through cap sync
// The plugins directory in the 'out' directory ensures it gets copied during cap sync
console.log('[HARDEN] Ensuring plugins directory exists in both build and assets directories...');

// Create plugins directory in www (out) directory first - this is critical for cap sync
if (!fs.existsSync(wwwPluginsDir)) {
    console.log('[HARDEN] Creating plugins directory in static export: out/plugins');
    fs.mkdirSync(wwwPluginsDir, { recursive: true });
    console.log('[HARDEN] Created plugins directory in static export successfully');
} else {
    console.log('[HARDEN] Plugins directory already exists in static export');
}

// Create .keep file in the www/plugins directory to ensure it's copied during cap sync
try {
    const keepFilePath = path.join(wwwPluginsDir, '.keep');
    fs.writeFileSync(keepFilePath, 'Preserve this directory to prevent "Unable to read file at path public/plugins" warning in Android logcat.\nThis file ensures the plugins directory exists for Capacitor bridge operations.\nCreated on: ' + new Date().toISOString());
    console.log('[HARDEN] Created .keep file in static export plugins directory');
} catch (error) {
    console.error('[HARDEN] ERROR: Could not write .keep file in static export:', error.message);
    process.exit(1);
}

// Also ensure plugins directory exists in final assets location after sync
if (!fs.existsSync(assetsPluginsDir)) {
    console.log('[HARDEN] Creating plugins directory in final assets: android/app/src/main/assets/public/plugins');
    fs.mkdirSync(assetsPluginsDir, { recursive: true });
    console.log('[HARDEN] Created plugins directory in final assets successfully');
} else {
    console.log('[HARDEN] Plugins directory already exists in final assets');
}

// Create .keep file in final assets location as backup
try {
    const keepFilePath = path.join(assetsPluginsDir, '.keep');
    fs.writeFileSync(keepFilePath, 'Preserve this directory to prevent "Unable to read file at path public/plugins" warning in Android logcat.\nThis file ensures the plugins directory exists for Capacitor bridge operations.\nCreated on: ' + new Date().toISOString());
    console.log('[HARDEN] Created .keep file in final assets plugins directory');
} catch (error) {
    console.error('[HARDEN] ERROR: Could not write .keep file in final assets:', error.message);
    process.exit(1);
}

// Additional hardening: Check if cordova files exist and create them if missing
const cordovaFiles = [
    'cordova.js',
    'cordova_plugins.js'
];

for (const fileName of cordovaFiles) {
    const filePath = path.join(assetsBasePath, fileName);
    if (!fs.existsSync(filePath)) {
        try {
            fs.writeFileSync(filePath, '// Cordova placeholder file for Capacitor compatibility\n// This file is required by some Capacitor plugins\nconst PLATFORM_VERSION_BUILD_LABEL = "10.0.0";');
            console.log(`[HARDEN] Created placeholder file: ${fileName}`);
        } catch (error) {
            console.error(`[HARDEN] ERROR: Could not create ${fileName}:`, error.message);
        }
    }
}

// Count total files in assets directory
try {
    const files = fs.readdirSync(assetsBasePath);
    console.log(`[HARDEN] Android assets directory contains ${files.length} items`);
    
    // Check for key directories
    const keyDirs = ['_next', 'home', 'tasks', 'events', 'downloads', 'plugins'];
    for (const dir of keyDirs) {
        const dirPath = path.join(assetsBasePath, dir);
        if (fs.existsSync(dirPath)) {
            console.log(`[HARDEN] ✓ Key directory exists: /${dir}/`);
        } else {
            console.error(`[HARDEN] ❌ Key directory missing: /${dir}/`);
            // Exit with error if plugins directory is missing
            if (dir === 'plugins') {
                process.exit(1);
            }
        }
    }
} catch (error) {
    console.error('[HARDEN] ERROR: Could not read assets directory:', error.message);
    process.exit(1);
}

console.log('[HARDEN] Android assets hardened successfully!');
console.log('[HARDEN] Plugin directory warning should now be resolved after cap sync.');
