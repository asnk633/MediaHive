// Post-copy harden script to ensure plugins directory exists after cap copy
const fs = require('fs');
const path = require('path');

const assetsBasePath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public');
const pluginsDir = path.join(assetsBasePath, 'plugins');

console.log('[POST-COPY HARDEN] Running post-copy hardening...');

// Create plugins directory in final assets location after copy
if (!fs.existsSync(pluginsDir)) {
    console.log('[POST-COPY HARDEN] Creating plugins directory in final assets: android/app/src/main/assets/public/plugins');
    fs.mkdirSync(pluginsDir, { recursive: true });
    console.log('[POST-COPY HARDEN] Created plugins directory in final assets successfully');
} else {
    console.log('[POST-COPY HARDEN] Plugins directory already exists in final assets');
}

// Create .keep file in final assets location
try {
    const keepFilePath = path.join(pluginsDir, '.keep');
    fs.writeFileSync(keepFilePath, 'Preserve this directory to prevent "Unable to read file at path public/plugins" warning in Android logcat.\nThis file ensures the plugins directory exists for Capacitor bridge operations.\nCreated on: ' + new Date().toISOString());
    console.log('[POST-COPY HARDEN] Created .keep file in final assets plugins directory');
} catch (error) {
    console.error('[POST-COPY HARDEN] ERROR: Could not write .keep file in final assets:', error.message);
    process.exit(1);
}

// Verify plugins directory exists
if (!fs.existsSync(pluginsDir)) {
    console.error('[POST-COPY HARDEN] ERROR: Plugins directory still missing after hardening!');
    process.exit(1);
}

console.log('[POST-COPY HARDEN] Plugins directory verified in final assets location!');
console.log('[POST-COPY HARDEN] Android asset hardening completed successfully!');