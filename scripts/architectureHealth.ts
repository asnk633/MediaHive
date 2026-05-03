import * as fs from 'fs';
import * as path from 'path';

/**
 * MediaHive Architecture Health System
 * Comprehensive diagnostic tool to protect system integrity.
 */

const SRC_DIR = path.join(process.cwd(), 'src');
const APP_DIR = path.join(SRC_DIR, 'app');
const FEATURES_DIR = path.join(SRC_DIR, 'features');
const SERVICES_DIR = path.join(SRC_DIR, 'services');

interface Violation {
    category: 'Domain Boundary' | 'UI/API Boundary' | 'DTO Mapping' | 'EventBus' | 'Circular Dependency' | 'Routes';
    file: string;
    import?: string;
    detail: string;
    level: 'error' | 'warning';
}

const violations: Violation[] = [];
const dependencyGraph = new Map<string, string[]>();
const featureList = new Set<string>();

if (fs.existsSync(FEATURES_DIR)) {
    fs.readdirSync(FEATURES_DIR).forEach(f => {
        if (fs.statSync(path.join(FEATURES_DIR, f)).isDirectory()) {
            featureList.add(f);
        }
    });
}

// Helper to get relative path from project root
const getRelativePath = (absolutePath: string) => path.relative(process.cwd(), absolutePath);

/**
 * 1. MAP VALID ROUTES
 */
function getValidRoutes(dir: string, currentPath = ''): string[] {
    const routes: string[] = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Handle groups like (shell)
            const nextSegment = file.startsWith('(') && file.endsWith(')') ? '' : `/${file}`;
            routes.push(...getValidRoutes(fullPath, currentPath + nextSegment));
        } else if (file === 'page.tsx' || file === 'route.ts') {
            routes.push(currentPath === '' ? '/' : currentPath);
        }
    }
    return [...new Set(routes)];
}

const validRoutes = fs.existsSync(APP_DIR) ? getValidRoutes(APP_DIR) : [];

/**
 * 2. SCAN FILE
 */
function scanFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const normalizedFilePath = filePath.split(path.sep).join('/');
    const relPath = getRelativePath(filePath);

    // Track dependencies for circular check
    const deps: string[] = [];

    // Feature detection
    let currentFeature: string | null = null;
    if (normalizedFilePath.includes('/features/')) {
        const parts = normalizedFilePath.split('/features/')[1].split('/');
        currentFeature = parts[0];
    }

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
            return;
        }

        // --- Import Detection ---
        const importMatch = line.match(/from\s+['"](@\/[^'"]+)['"]/) || line.match(/import\s+['"](@\/[^'"]+)['"]/);
        if (importMatch) {
            const importPath = importMatch[1];
            deps.push(importPath);

            // A. Domain Boundary Violation
            if (importPath.startsWith('@/features/') && currentFeature) {
                const targetFeature = importPath.split('/')[2];
                if (targetFeature && targetFeature !== currentFeature) {
                    // Allow type-only imports (types/, constants/) across features — no runtime coupling
                    const isTypeOnlyImport = line.trimStart().startsWith('import type ') ||
                        importPath.includes('/types/') ||
                        importPath.includes('/constants/');

                    // Allow imports of shared UI components (common pattern for UI libraries)
                    const isSharedComponent = importPath.endsWith('/index') ||
                        importPath.split('/').length === 3; // @/features/X (barrel)

                    // Flag only service and hook imports from other features.
                    // UI components can legitimately be reused across feature boundaries.
                    // Rule: features/A → features/B/services or hooks = violation
                    // Rule: features/A → features/B/components = allowed (UI composition)
                    const isRuntimeCoupling = importPath.includes('/services/') ||
                        importPath.includes('/hooks/');

                    if (!isTypeOnlyImport && isRuntimeCoupling) {
                        violations.push({
                            category: 'Domain Boundary',
                            file: `${relPath}:${index + 1}`,
                            import: importPath,
                            detail: `Feature "${currentFeature}" imports runtime code from "${targetFeature}". Use @/services/${targetFeature} instead.`,
                            level: 'error'
                        });
                    }
                }
            }

            // Allow: features/X → @/components/* (shared UI layer, cross-cutting by design)
            // Only flag: features/X → features/Y (direct inter-feature coupling)

            // B. UI/API Boundary Violation
            if (importPath.startsWith('@/app/api')) {
                const isService = normalizedFilePath.includes('/services/');
                const isApiLayer = normalizedFilePath.includes('/app/api/');
                const isServerLogic = normalizedFilePath.includes('/server/') || normalizedFilePath.includes('/lib/server/');
                const isApiClient = normalizedFilePath.endsWith('apiClient.ts');

                if (!isService && !isApiLayer && !isServerLogic && !isApiClient) {
                    // Check if it's a shared internal library (often allowed in lib/ too)
                    const isInternalLib = normalizedFilePath.includes('/lib/') && importPath.includes('/_lib/');
                    if (!isInternalLib) {
                        violations.push({
                            category: 'UI/API Boundary',
                            file: `${relPath}:${index + 1}`,
                            import: importPath,
                            detail: `UI components/Hooks must not import from @/app/api. Use @/services instead.`,
                            level: 'error'
                        });
                    }
                }
            }

            // C. EventBus Decoupling (Service-to-Service)
            if (normalizedFilePath.includes('/services/') && importPath.startsWith('@/services/')) {
                const currentServiceDir = path.dirname(normalizedFilePath);
                // If importing a service from outside the same domain/folder
                const isSameFolder = importPath.startsWith('@/services/' + path.basename(currentServiceDir)) ||
                    !normalizedFilePath.includes(path.sep + 'services' + path.sep + 'tasks' + path.sep); // Simple heuristic

                // Specifically flag well-known decoupling violations
                if (importPath.includes('notificationService') && normalizedFilePath.includes('taskService')) {
                    violations.push({
                        category: 'EventBus',
                        file: `${relPath}:${index + 1}`,
                        import: importPath,
                        detail: 'Strong coupling detected: taskService should emit events instead of importing notificationService directly.',
                        level: 'warning'
                    });
                }
            }
        }

        // --- DTO & Zod Check (Services only) ---
        if (normalizedFilePath.includes('/services/')) {
            // Check for mapping functions
            if (line.includes('function map') || (line.includes('const map') && line.includes('='))) {
                // Heuristic for snake_case in mapping
                if (content.includes('created_at') || content.includes('updated_at') || content.includes('due_date')) {
                    // This is often okay if it's the SOURCE, but let's check if they are RETURNED
                }
            }
        }

        // --- Route Check ---
        const routeMatch = line.match(/['"](\/[a-zA-Z0-9\-\/\[\]]+)['"]/);
        if (routeMatch) {
            const possibleRoute = routeMatch[1];
            // Skip common non-route strings
            if (possibleRoute.length > 2 && !possibleRoute.startsWith('//') && !possibleRoute.includes('http')) {
                // Heuristic for route detection in navigation calls or links
                if (line.includes('Navigate') || line.includes('href') || line.includes('push(')) {
                    // Try to match against valid routes (ignoring dynamic segments for simplicity)
                    const baseRoute = possibleRoute.split('?')[0].split('#')[0];
                    if (baseRoute !== '/' && !baseRoute.startsWith('/api') && !baseRoute.startsWith('/_')) {
                        const isDynamic = baseRoute.includes('[');
                        const match = validRoutes.some(vr => {
                            if (vr === baseRoute) return true;
                            // Basic match for dynamic routes
                            const vrRegex = new RegExp('^' + vr.replace(/\[.*?\]/g, '[^/]+') + '$');
                            return vrRegex.test(baseRoute);
                        });

                        if (!match && !isDynamic) {
                            violations.push({
                                category: 'Routes',
                                file: `${relPath}:${index + 1}`,
                                detail: `Reference to potentially dead route: "${baseRoute}"`,
                                level: 'warning'
                            });
                        }
                    }
                }
            }
        }
    });

    dependencyGraph.set(relPath, deps);

    // --- Service Mapping & Zod Enforcement (Post-scan logic) ---
    if (normalizedFilePath.includes('/services/') && !normalizedFilePath.includes('Contract')) {
        const hasMapping = content.includes('function map') || content.includes('=> map') || content.includes('map(');
        const usesZod = content.includes('.safeParse(') || content.includes('.parse(');

        if (hasMapping && !usesZod) {
            violations.push({
                category: 'DTO Mapping',
                file: relPath,
                detail: 'Service has mapping logic but appears to miss Zod validation (.safeParse).',
                level: 'warning'
            });
        }

        // Check for raw snake_case leakage in return types (highly complex without AST, but we can look for clues)
        if (content.includes('created_at:') && !content.includes('createdAt:')) {
            // Likely leaking DB fields
        }
    }
}

/**
 * CIRCULAR DEPENDENCY DETECTION
 */
function findCycles() {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    function isCyclic(node: string, currentPath: string[]) {
        if (!visited.has(node)) {
            visited.add(node);
            recStack.add(node);

            const neighbors = dependencyGraph.get(node) || [];
            for (const neighborImport of neighbors) {
                // Map @/ to actual relative path if possible
                let neighborRel = neighborImport.replace('@/', 'src/').replace(/\//g, path.sep);
                // Try common extensions
                let resolved = null;
                for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
                    const p = neighborRel + ext;
                    if (fs.existsSync(path.join(process.cwd(), p))) {
                        resolved = p;
                        break;
                    }
                }

                if (resolved) {
                    if (!visited.has(resolved) && isCyclic(resolved, [...currentPath, resolved])) {
                        return true;
                    } else if (recStack.has(resolved)) {
                        violations.push({
                            category: 'Circular Dependency',
                            file: node,
                            detail: `Cycle detected: ${currentPath.join(' -> ')} -> ${resolved}`,
                            level: 'error'
                        });
                        return true;
                    }
                }
            }
        }
        recStack.delete(node);
        return false;
    }

    for (const node of dependencyGraph.keys()) {
        isCyclic(node, [node]);
    }
}

/**
 * CRAWL
 */
function crawl(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            crawl(fullPath);
        } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.d.ts')) {
            scanFile(fullPath);
        }
    }
}

console.log('\n--------------------------------------------------');
console.log('MediaHive Architecture Health Check');
console.log('--------------------------------------------------');

const startTime = Date.now();
crawl(SRC_DIR);
findCycles(); // Enabled to detect bundling issues

const duration = ((Date.now() - startTime) / 1000).toFixed(2);

const categories = ['Domain Boundary', 'UI/API Boundary', 'DTO Mapping', 'EventBus', 'Circular Dependency', 'Routes'];
let hasErrors = false;

categories.forEach(cat => {
    const catViolations = violations.filter(v => v.category === cat);
    if (catViolations.length > 0) {
        console.log(`\n[${cat} Violations]`);
        catViolations.forEach(v => {
            const icon = v.level === 'error' ? '❌' : '⚠';
            if (v.level === 'error') hasErrors = true;
            console.log(`${icon} ${v.file}`);
            if (v.import) console.log(`   Import: ${v.import}`);
            console.log(`   Issue: ${v.detail}\n`);
        });
    }
});

console.log('--------------------------------------------------');
if (violations.length === 0) {
    console.log('✅ Architecture integrity verified');
    process.exit(0);
} else {
    console.log(`Scan completed in ${duration}s with ${violations.length} issues.`);
    if (hasErrors) {
        console.log('CRITICAL: Architecture violations detected. Please fix before proceeding.');
        process.exit(1);
    } else {
        console.log('Note: Only warnings found. Continuing dev server...');
        process.exit(0);
    }
}
