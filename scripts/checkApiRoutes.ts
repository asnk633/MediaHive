#!/usr/bin/env node
/**
 * scripts/checkApiRoutes.ts
 *
 * Scans src/app/api for subdirectories that contain no route.ts/route.tsx,
 * meaning they are empty API directories with no handler — a common 
 * regression after refactors.
 */

import fs from 'fs';
import path from 'path';

const API_DIR = path.resolve(process.cwd(), 'src/app/api');

// Folders that are intentionally handler-free (shared libs, utilities)
const SKIP_PATTERNS = [
    /^_lib$/,
    /^_helpers$/,
    /^_middleware$/,
    /^middleware$/,
    /^\[/,  // Dynamic segment – may delegate to parent
];

interface MissingRoute {
    apiPath: string;
    absPath: string;
}

function shouldSkip(name: string): boolean {
    return SKIP_PATTERNS.some(p => p.test(name));
}

function scanApiDir(dir: string, apiBase: string, results: MissingRoute[]) {
    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return;
    }

    const hasRoute = entries.some(e =>
        e.isFile() && (e.name === 'route.ts' || e.name === 'route.tsx' || e.name === 'route.js')
    );

    const subdirs = entries.filter(e => e.isDirectory() && !shouldSkip(e.name));

    // A leaf directory (no subdirs) without a route.ts is broken
    if (!hasRoute && subdirs.length === 0 && apiBase !== '') {
        results.push({ apiPath: apiBase, absPath: dir });
    }

    for (const sub of subdirs) {
        scanApiDir(
            path.join(dir, sub.name),
            `${apiBase}/${sub.name}`,
            results
        );
    }
}

export function checkApiRoutes(): MissingRoute[] {
    const missing: MissingRoute[] = [];
    if (!fs.existsSync(API_DIR)) return missing;

    const topLevel = fs.readdirSync(API_DIR, { withFileTypes: true });
    for (const entry of topLevel) {
        if (!entry.isDirectory() || shouldSkip(entry.name)) continue;
        scanApiDir(path.join(API_DIR, entry.name), `/${entry.name}`, missing);
    }

    return missing;
}

// Standalone run
if (require.main === module) {
    const issues = checkApiRoutes();
    if (issues.length === 0) {
        console.log('✅  All API directories have route handlers.');
    } else {
        console.warn(`\n⚠️  [API Route Check] ${issues.length} API folder(s) missing a route.ts:\n`);
        for (const { apiPath, absPath } of issues) {
            const rel = path.relative(process.cwd(), absPath).replace(/\\/g, '/');
            console.warn(`  • /api${apiPath.padEnd(40)} → ${rel}`);
        }
        console.warn('');
    }
}
