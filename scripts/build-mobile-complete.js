#!/usr/bin/env node

// Complete mobile build pipeline with error handling
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD_STEPS = [
    { name: 'Clean previous build', cmd: 'rimraf .next out android/app/src/main/assets/public' },
    { name: 'Build static export', cmd: 'cross-env IS_MOBILE=true next build' },
    { name: 'Capacitor sync', cmd: 'npx cap sync android' },
    { name: 'Hardening assets', cmd: 'node scripts/harden-android.js' },
    { name: 'Validate assets', cmd: 'node scripts/validate-assets.js' }
];

console.log('🚀 Starting complete mobile build pipeline...\n');

let stepIndex = 0;

try {
    for (const step of BUILD_STEPS) {
        stepIndex++;
        console.log(`\n${stepIndex}/${BUILD_STEPS.length}. ${step.name}`);
        console.log(`   Command: ${step.cmd}`);
        
        const startTime = Date.now();
        execSync(step.cmd, { stdio: 'inherit' });
        const endTime = Date.now();
        
        console.log(`   ✅ Completed in ${(endTime - startTime) / 1000}s`);
    }
    
    console.log('\n🎉 Mobile build pipeline completed successfully!');
    console.log('   - Static export generated');
    console.log('   - Capacitor synchronized');
    console.log('   - Assets hardened (plugins directory created)');
    console.log('   - Assets validated');
    console.log('   - Ready for Android deployment');
    
    // Final verification
    const pluginsPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public', 'plugins');
    if (fs.existsSync(pluginsPath)) {
        console.log('\n📋 Final verification:');
        console.log('   ✓ plugins directory exists at android/app/src/main/assets/public/plugins');
        console.log('   ✓ This should eliminate the "Unable to read file at path public/plugins" warning');
    }
    
} catch (error) {
    console.error(`\n❌ Build failed at step ${stepIndex}: ${BUILD_STEPS[stepIndex - 1].name}`);
    console.error(`   Command: ${BUILD_STEPS[stepIndex - 1].cmd}`);
    console.error(`   Error: ${error.message}`);
    process.exit(1);
}