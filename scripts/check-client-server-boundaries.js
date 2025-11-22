#!/usr/bin/env node

// scripts/check-client-server-boundaries.js
// Script to scan for server/client boundary violations in the codebase

const fs = require('fs');
const path = require('path');

// Directories to scan
const SRC_DIR = path.join(__dirname, '..', 'src');

// Patterns to identify client components/hooks
const CLIENT_PATTERNS = [
  'useState',
  'useEffect',
  'useLayoutEffect',
  'useRef',
  'useContext',
  'useReducer',
  'useCallback',
  'useMemo',
  'useTransition',
  'useDeferredValue',
  'useId',
  'useSyncExternalStore',
  'useInsertionEffect',
  'useImperativeHandle'
];

// Patterns to identify server-only code
const SERVER_PATTERNS = [
  'window\\.',
  'document\\.',
  'localStorage\\.',
  'sessionStorage\\.',
  'navigator\\.',
  'location\\.',
  'history\\.',
  'alert\\(',
  'confirm\\(',
  'prompt\\('
];

// Files that are clearly client-side utilities and can be excluded from server-only checks
const CLIENT_SIDE_UTIL_FILES = [
  'init-pwa.ts',
  'service-worker.ts',
  'offline-sync.ts',
  'client-fetch-wrapper.ts'
];

// Files to exclude from scanning
const EXCLUDE_FILES = [
  'node_modules',
  '.next',
  'out',
  'dist',
  'build'
];

// Check if a file should be excluded
function shouldExclude(filePath) {
  return EXCLUDE_FILES.some(exclude => filePath.includes(exclude));
}

// Check if a file is a client component
function isClientComponent(content) {
  return content.includes('"use client"') || content.includes("'use client'");
}

// Check if a file contains client patterns
function containsClientPatterns(content) {
  return CLIENT_PATTERNS.some(pattern => content.includes(pattern));
}

// Check if a file contains server patterns
function containsServerPatterns(content) {
  const regexPatterns = SERVER_PATTERNS.map(pattern => new RegExp(pattern, 'g'));
  return regexPatterns.some(regex => regex.test(content));
}

// Scan a directory recursively
function scanDirectory(dir, violations) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    
    // Skip excluded files/directories
    if (shouldExclude(filePath)) {
      continue;
    }
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath, violations);
    } else if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for client components that might be used in server components
        if (isClientComponent(content) || containsClientPatterns(content)) {
          // This is a client component, check if it's being imported by server components
          // For now, we'll just log that it's a client component
          // In a more sophisticated implementation, we would check imports
        }
        
        // Check for server-only code in client components
        const fileName = path.basename(filePath);
        const isClientSideUtil = CLIENT_SIDE_UTIL_FILES.some(utilFile => fileName.includes(utilFile));
        
        if (containsServerPatterns(content) && !isClientComponent(content) && !isClientSideUtil) {
          violations.push({
            file: filePath,
            type: 'server-code-in-server-component',
            message: 'File contains server-only patterns but is not marked as client component'
          });
        }
        
        // Check for duplicate "use client" directives
        const useClientMatches = content.match(/["']use client["']/g);
        if (useClientMatches && useClientMatches.length > 1) {
          violations.push({
            file: filePath,
            type: 'duplicate-use-client',
            message: `File contains ${useClientMatches.length} "use client" directives`
          });
        }
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
      }
    }
  }
}

// Main function
function main() {
  console.log('Checking client/server boundaries...');
  
  const violations = [];
  
  // Scan source directory
  scanDirectory(SRC_DIR, violations);
  
  // Report violations
  if (violations.length > 0) {
    console.log('\nFound violations:');
    violations.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.file}`);
      console.log(`   Type: ${violation.type}`);
      console.log(`   Message: ${violation.message}\n`);
    });
    
    console.log(`\nTotal violations found: ${violations.length}`);
    process.exit(1);
  } else {
    console.log('No violations found. Client/server boundaries are correct.');
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  isClientComponent,
  containsClientPatterns,
  containsServerPatterns
};