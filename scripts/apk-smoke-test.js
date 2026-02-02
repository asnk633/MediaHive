#!/usr/bin/env node

/**
 * APK Smoke Test Automation
 * Runs after build to verify Android runtime behavior
 */

const { spawn } = require('child_process');
const fs = require('fs');

async function runSmokeTest() {
  console.log('[SMOKE TEST] Starting APK smoke test...');
  
  // Check if APK exists
  const apkPath = 'android/app/build/outputs/apk/debug/app-debug.apk';
  if (!fs.existsSync(apkPath)) {
    console.error('[SMOKE TEST] ❌ APK not found at:', apkPath);
    process.exit(1);
  }
  console.log('[SMOKE TEST] ✅ APK found');
  
  // Check if adb is available
  try {
    await runCommand('adb', ['version']);
    console.log('[SMOKE TEST] ✅ ADB available');
  } catch (err) {
    console.error('[SMOKE TEST] ❌ ADB not found. Please install Android SDK tools.');
    process.exit(1);
  }
  
  // Check connected devices
  try {
    const devicesOutput = await runCommand('adb', ['devices']);
    const lines = devicesOutput.split('\n').filter(line => line.includes('\tdevice'));
    if (lines.length === 0) {
      console.error('[SMOKE TEST] ❌ No Android devices connected. Please connect a device or start an emulator.');
      process.exit(1);
    }
    console.log(`[SMOKE TEST] ✅ ${lines.length} device(s) connected`);
  } catch (err) {
    console.error('[SMOKE TEST] ❌ Failed to check connected devices:', err.message);
    process.exit(1);
  }
  
  // Install APK
  try {
    console.log('[SMOKE TEST] Installing APK...');
    await runCommand('adb', ['install', '-r', apkPath]);
    console.log('[SMOKE TEST] ✅ APK installed successfully');
  } catch (err) {
    console.error('[SMOKE TEST] ❌ Failed to install APK:', err.message);
    process.exit(1);
  }
  
  // Clear logs
  await runCommand('adb', ['logcat', '-c']).catch(() => {});
  
  // Start monitoring logs
  console.log('[SMOKE TEST] Starting log monitoring for 30 seconds...');
  const logcat = spawn('adb', ['logcat']);
  
  let logBuffer = [];
  let testPassed = false;
  let timeoutId;
  
  logcat.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.includes('thaibagarden')) {
        logBuffer.push(line.trim());
        console.log('[LOG]', line.trim());
        
        // Check for required conditions
        if (line.includes('[NATIVE CHECK]') && 
            line.includes('isNative=true') && 
            line.includes('https://')) {
          console.log('[SMOKE TEST] ✅ Native check shows absolute URL');
        }
        
        if (line.includes('[API OUTGOING]') && 
            line.includes('https://') && 
            !line.includes('localhost') && 
            !line.includes('/api/')) {
          console.log('[SMOKE TEST] ✅ API calls are absolute and not localhost');
        }
        
        // Check for successful auth
        if (line.includes('[API]') && line.includes('200')) {
          console.log('[SMOKE TEST] ✅ API call returned 200');
        }
        
        // Check for navigation to /home
        if (line.includes('[BOOT]') && line.includes('Navigating -> /home')) {
          console.log('[SMOKE TEST] ✅ Navigation to /home detected');
          testPassed = true;
        }
        
        // Check for boot loops
        if (line.includes('Error') && line.includes('BLOCKED')) {
          console.error('[SMOKE TEST] ❌ Fatal error detected:', line.trim());
          testPassed = false;
        }
      }
    }
  });
  
  logcat.stderr.on('data', (data) => {
    console.error('[LOGCAT ERROR]', data.toString());
  });
  
  // Set timeout
  timeoutId = setTimeout(() => {
    logcat.kill();
    if (testPassed) {
      console.log('[SMOKE TEST] ✅ Smoke test PASSED');
      console.log('[SMOKE TEST] Captured logs:');
      logBuffer.forEach(line => console.log('  ', line));
      process.exit(0);
    } else {
      console.error('[SMOKE TEST] ❌ Smoke test FAILED - Required conditions not met');
      console.log('[SMOKE TEST] Captured logs:');
      logBuffer.forEach(line => console.log('  ', line));
      process.exit(1);
    }
  }, 30000); // 30 seconds timeout
  
  // Handle process exit
  process.on('SIGINT', () => {
    clearTimeout(timeoutId);
    logcat.kill();
    console.log('[SMOKE TEST] Test interrupted');
    process.exit(1);
  });
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

// Run the test
runSmokeTest().catch(err => {
  console.error('[SMOKE TEST] ❌ Test failed with error:', err.message);
  process.exit(1);
});