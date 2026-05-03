import * as fs from 'fs';
import * as path from 'path';

/**
 * MediaHive Architecture Guard
 * Enforces domain boundaries and service-oriented communication.
 */

const SRC_DIR = path.join(process.cwd(), 'src');
const FEATURES_DIR = path.join(SRC_DIR, 'features');

interface Violation {
    file: string;
    type: 'Cross-Feature' | 'Direct-API';
    import: string;
    detail: string;
}

const violations: Violation[] = [];

// Helper to get relative path from project root
const getRelativePath = (absolutePath: string) => path.relative(process.cwd(), absolutePath);

// Helper to detect feature name from path
const getFeatureName = (filePath: string) => {
    if (filePath.startsWith(FEATURES_DIR)) {
        const relative = path.relative(FEATURES_DIR, filePath);
        return relative.split(path.sep)[0];
    }
    return null;
};

/**
 * Scan a file for architectural violations
 */
function scanFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const currentFeature = getFeatureName(filePath);
    const normalizedFilePath = filePath.split(path.sep).join('/');

    lines.forEach((line, index) => {
        // Basic regex for imports (handles both static and dynamic imports)
        const importMatch = line.match(/from\s+['"](@\/[^'"]+)['"]/) || line.match(/import\s+['"](@\/[^'"]+)['"]/);
        if (!importMatch) return;

        const importPath = importMatch[1];

        // 1. Detect Direct API Imports (UI -> API)
        // Allowed only in services, backend logic, or within the API layer itself
        if (importPath.startsWith('@/app/api')) {
            const isService = normalizedFilePath.includes('/services/');
            const isApiClient = normalizedFilePath.endsWith('apiClient.ts');
            const isApiLayer = normalizedFilePath.includes('/app/api/');
            const isServerLogic = normalizedFilePath.includes('/server/') ||
                normalizedFilePath.includes('/lib/server/');

            if (!isService && !isApiClient && !isApiLayer && !isServerLogic) {
                // Check if it's a shared internal library (often allowed in lib/ too)
                const isInternalLib = normalizedFilePath.includes('/lib/') && importPath.includes('/_lib/');

                if (!isInternalLib) {
                    violations.push({
                        file: `${getRelativePath(filePath)}:${index + 1}`,
                        type: 'Direct-API',
                        import: importPath,
                        detail: 'UI components must use services instead of importing from @/app/api directly.'
                    });
                }
            }
        }

        // 2. Detect Cross-Feature Imports (Feature A -> Feature B)
        if (importPath.startsWith('@/features/') && currentFeature) {
            const parts = importPath.split('/');
            const targetFeature = parts[2]; // @/features/FEATURE_NAME/...

            if (targetFeature && targetFeature !== currentFeature) {
                // Dashboard is often an aggregator, but it should still ideally use @/services
                // However, many existing dashboards are peer features.
                // We will report them and let the team decide on exemptions.
                violations.push({
                    file: `${getRelativePath(filePath)}:${index + 1}`,
                    type: 'Cross-Feature',
                    import: importPath,
                    detail: `Feature "${currentFeature}" is importing directly from "${targetFeature}". Use @/services instead.`
                });
            }
        }
    });
}

/**
 * Recursively crawl src directory
 */
function crawl(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            crawl(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            // Skip declarations and tests if needed
            if (!file.endsWith('.d.ts') && !file.includes('.test.') && !file.includes('.spec.')) {
                scanFile(fullPath);
            }
        }
    }
}

console.log('\n🔎 MediaHive Architecture Guard scanning...');
const startTime = Date.now();

try {
    crawl(SRC_DIR);
} catch (error) {
    console.error('Error during scan:', error);
    process.exit(1);
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);

if (violations.length > 0) {
    console.log(`\n⚠️  Architecture violations detected (${violations.length}):\n`);

    violations.forEach(v => {
        console.log(`❌ ${v.type} Violation`);
        console.log(`   File: ${v.file}`);
        console.log(`   Import: ${v.import}`);
        console.log(`   Issue: ${v.detail}\n`);
    });

    console.log(`Scan completed in ${duration}s with failures.`);
    process.exit(1);
} else {
    console.log(`\n✅ Architecture validation passed! (Scanned in ${duration}s)\n`);
    process.exit(0);
}
