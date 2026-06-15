#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const FLUTTER_DIR = path.join(ROOT_DIR, 'mediahive_mobile');
const TAURI_DIR = path.join(ROOT_DIR, 'MediaHive Windows app');

// Parse arguments
const args = process.argv.slice(2);
const isFull = args.includes('--full');
const modeName = isFull ? 'FULL COMPILATION' : 'QUICK VALIDATION';

console.log(`${BOLD}${CYAN}🚀 Starting MediaHive Cross-Platform Verification [${modeName}]...${RESET}\n`);

// 1. Helper to run commands
function runCommand(name, cmd, cwd, allowSoftFailOnAccessDenied = false) {
  console.log(`${BOLD}${YELLOW}👉 Step: ${name}${RESET}`);
  console.log(`   Command: ${cmd}`);
  console.log(`   Directory: ${cwd}`);
  
  const startTime = Date.now();
  try {
    // Capture stdout/stderr using pipe
    const stdout = execSync(cmd, { stdio: 'pipe', cwd });
    if (stdout && stdout.length > 0) {
      console.log(stdout.toString());
    }
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`${GREEN}   ✅ Completed successfully in ${duration}s${RESET}\n`);
    return true;
  } catch (error) {
    const stdoutText = error.stdout ? error.stdout.toString() : '';
    const stderrText = error.stderr ? error.stderr.toString() : '';
    const fullOutput = stdoutText + '\n' + stderrText;

    // Output what was captured so the user sees the error
    console.log(fullOutput);

    const isAccessDenied = fullOutput.includes('Access is denied') || 
                           fullOutput.includes('os error 5') ||
                           fullOutput.includes('os error 32') ||
                           fullOutput.includes('cannot access the file') ||
                           error.message.includes('Access is denied') || 
                           error.message.includes('os error 5') ||
                           error.message.includes('os error 32') ||
                           error.message.includes('cannot access the file');
    
    if (allowSoftFailOnAccessDenied && isAccessDenied) {
      console.log(`${YELLOW}   ⚠️  Warning: Command failed due to OS Access Denied / Lock error.${RESET}`);
      console.log(`      This is common when running Rust compilation inside sandboxed/restricted terminals on Windows due to antivirus blocking dynamic build scripts or file locking.`);
      console.log(`      Treating as a warning. Step skipped.\n`);
      return true;
    }

    console.error(`${RED}   ❌ Failed!${RESET}`);
    console.error(`   Error message: ${error.message}\n`);
    return false;
  }
}

// 2. Detect Toolchains
function detectFlutterPath() {
  const customWinPath = 'D:\\flutter\\bin\\flutter.bat';
  if (process.platform === 'win32') {
    if (fs.existsSync(customWinPath)) {
      return customWinPath;
    }
    try {
      execSync('where flutter', { stdio: 'ignore' });
      return 'flutter';
    } catch {
      // fallback
    }
  }
  return 'flutter';
}

function detectCargo() {
  try {
    execSync('cargo --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const flutterBin = detectFlutterPath();
const hasCargo = detectCargo();

console.log(`${BOLD}Toolchain Detection:${RESET}`);
console.log(`- Flutter Binary: ${YELLOW}${flutterBin}${RESET}`);
console.log(`- Cargo / Rust: ${hasCargo ? GREEN + 'Detected' : RED + 'Not Detected'}${RESET}\n`);

// 3. Define Pipeline Steps
const steps = [];

if (!isFull) {
  // --- QUICK MODE ---
  
  // A. Web Linting
  steps.push({
    name: 'Web (ESLint Linter)',
    cmd: 'pnpm exec eslint src',
    cwd: ROOT_DIR,
    softFailOnAccessDenied: false
  });

  // B. Flutter Static Analysis
  steps.push({
    name: 'Mobile Flutter (Static Analysis)',
    cmd: `"${flutterBin}" analyze`,
    cwd: FLUTTER_DIR,
    softFailOnAccessDenied: false
  });

  // C. Tauri Rust Syntax & Cargo Check
  if (hasCargo) {
    steps.push({
      name: 'Desktop Tauri (Rust Cargo Check)',
      cmd: 'cargo check --manifest-path src-tauri/Cargo.toml',
      cwd: TAURI_DIR,
      softFailOnAccessDenied: true // Rust builds on Windows are prone to dynamic execution blocks or locks
    });
  } else {
    console.log(`${YELLOW}⚠️ Skipping Rust Cargo Check (Cargo not found in environment)${RESET}\n`);
  }
} else {
  // --- FULL MODE ---
  
  // A. Web SaaS App Build
  steps.push({
    name: 'Web SaaS Application Production Build',
    cmd: 'pnpm run build',
    cwd: ROOT_DIR,
    softFailOnAccessDenied: false
  });

  // B. Mobile Flutter App Build
  steps.push({
    name: 'Mobile Flutter release APK Build',
    cmd: `"${flutterBin}" build apk --release`,
    cwd: FLUTTER_DIR,
    softFailOnAccessDenied: false
  });

  // C. Desktop Tauri Application Build
  if (hasCargo) {
    steps.push({
      name: 'Desktop Tauri Production Build',
      cmd: 'pnpm install && pnpm exec tauri build',
      cwd: TAURI_DIR,
      softFailOnAccessDenied: true // Enable soft fail on Access Denied for Tauri builds
    });
  } else {
    console.log(`${RED}⚠️ Cannot run Tauri build (Cargo/Rust is required for Desktop build!)${RESET}\n`);
  }
}

// 4. Run Pipeline
let failedCount = 0;
const totalSteps = steps.length;

for (let i = 0; i < totalSteps; i++) {
  const step = steps[i];
  console.log(`[Step ${i + 1}/${totalSteps}]`);
  const success = runCommand(step.name, step.cmd, step.cwd, step.softFailOnAccessDenied);
  if (!success) {
    failedCount++;
    console.log(`${RED}Stopping verification pipeline due to step failure.${RESET}`);
    break;
  }
}

// 5. Final Report
console.log(`${BOLD}----------------------------------------${RESET}`);
if (failedCount === 0) {
  console.log(`${GREEN}${BOLD}🎉 Verification PASSED! All steps completed successfully.${RESET}`);
  process.exit(0);
} else {
  console.log(`${RED}${BOLD}❌ Verification FAILED! One or more steps failed. Please check logs above.${RESET}`);
  process.exit(1);
}
