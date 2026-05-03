#!/usr/bin/env node
/**
 * scripts/checkRoutes.ts
 * 
 * Scans src/app for route folders that are missing a page.tsx, 
 * indicating dead / unreachable Next.js App Router routes.
 * 
 * Exclusions: API routes, layout-only folders, (public)/(shell) route groups,
 * _lib, _components, utility folders.
 */

import fs from 'fs';
import path from 'path';

const APP_DIR = path.resolve(process.cwd(), 'src/app');

// Folders that never need a page.tsx by design
const SKIP_PATTERNS = [
    /^api$/,
    /^_/,         // _lib, _components, etc.
    /^\(/,        // (shell), (public) route groups – these are transparent
    /^admin$/,    // standalone admin route group covered separately
    /^debug$/,
    /^test$/,
    /^simulation-demo$/,
    /^report-preview$/,
    /^leave$/,
];

interface MissingPage {
    route: string;
    absPath: string;
}

function shouldSkip(name: string): boolean {
    return SKIP_PATTERNS.some(p => p.test(name));
}

function isRouteGroup(name: string): boolean {
    return name.startsWith('(') && name.endsWith(')');
}

function scanDir(dir: string, routeBase: string, results: MissingPage[]) {
    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return;
    }

    const hasPage = entries.some(e =>
        e.isFile() && (e.name === 'page.tsx' || e.name === 'page.ts' || e.name === 'page.jsx')
    );
    const hasLayout = entries.some(e => e.isFile() && e.name === 'layout.tsx');
    const hasClient = entries.some(e => e.isFile() && e.name.endsWith('Client.tsx'));
    const hasSubdirs = entries.some(e => e.isDirectory() && !shouldSkip(e.name));

    // Flag as missing if: has a Client component (implying it should be a page),
    // or has no page.tsx but also has subdirectories (is a segment that needs a page)
    // AND is not just a layout-only folder
    if (!hasPage && (hasClient || (!hasLayout && hasSubdirs && routeBase !== ''))) {
        if (hasClient) {
            results.push({ route: routeBase || '/', absPath: dir });
        }
    }

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (shouldSkip(entry.name)) continue;

        const childPath = path.join(dir, entry.name);
        const childRoute = isRouteGroup(entry.name)
            ? routeBase  // transparent – doesn't add to URL
            : `${routeBase}/${entry.name}`;

        scanDir(childPath, childRoute, results);
    }
}

export function checkRoutes(): MissingPage[] {
    const missing: MissingPage[] = [];

    // Scan the shell for routes
    const shellDir = path.join(APP_DIR, '(shell)');
    if (fs.existsSync(shellDir)) {
        const entries = fs.readdirSync(shellDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory() || shouldSkip(entry.name)) continue;
            scanDir(path.join(shellDir, entry.name), `/${entry.name}`, missing);
        }
    }

    // Also check the root shell page
    const rootPage = path.join(shellDir || APP_DIR, 'page.tsx');
    if (!fs.existsSync(rootPage)) {
        missing.push({ route: '/', absPath: shellDir || APP_DIR });
    }

    return missing;
}

// Standalone run
if (require.main === module) {
    const issues = checkRoutes();
    if (issues.length === 0) {
        console.log('✅  All routes have page.tsx wrappers.');
    } else {
        console.warn(`\n⚠️  [Route Check] ${issues.length} route folder(s) missing a page.tsx:\n`);
        for (const { route, absPath } of issues) {
            const rel = path.relative(process.cwd(), absPath).replace(/\\/g, '/');
            console.warn(`  • ${route.padEnd(40)} → ${rel}`);
        }
        console.warn('');
    }
}
