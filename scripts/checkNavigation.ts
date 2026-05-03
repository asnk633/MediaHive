#!/usr/bin/env node
/**
 * scripts/checkNavigation.ts
 *
 * Scans the codebase for href="/..." and router.push("/...") calls,
 * then verifies that each referenced route has a corresponding page.tsx
 * in the App Router structure.
 *
 * Outputs a list of "dead links" — navigation pointing to non-existent routes.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = path.resolve(process.cwd(), 'src');
const APP_DIR = path.resolve(process.cwd(), 'src/app');

// Route groups that are transparent (removed from the URL)
const TRANSPARENT_GROUPS = ['(shell)', '(public)', '(app)'];

// Routes that are intentionally external, dynamic, or framework-internal
const IGNORE_ROUTES = new Set([
    '/',
    '/login',
    '/api',
    '/_next',
    '/manifest.webmanifest',
    '/icon.png',
]);

// Prefixes that are expected to be dynamic – skip them
const DYNAMIC_PREFIXES = ['/api/', '/_next/', '/static/', '/images/', '/fonts/'];

interface DeadLink {
    route: string;
    file: string;
    line: number;
}

/** Build a set of all valid routes from the App Router directory structure */
function buildLocalRouteSet(): Set<string> {
    const routes = new Set<string>();

    function walk(dir: string, urlBase: string) {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }

        const hasPage = entries.some(e =>
            e.isFile() && (e.name === 'page.tsx' || e.name === 'page.ts' || e.name === 'page.jsx')
        );
        if (hasPage) {
            routes.add(urlBase === '' ? '/' : urlBase);
        }

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const name = entry.name;

            // Route groups are transparent
            if (name.startsWith('(') && name.endsWith(')')) {
                walk(path.join(dir, name), urlBase);
                continue;
            }

            // Skip non-route dirs
            if (name === 'api' || name.startsWith('_') || name === 'admin') continue;

            const segmentName = name.startsWith('[') ? name : name;
            walk(path.join(dir, name), `${urlBase}/${segmentName}`);
        }
    }

    walk(APP_DIR, '');

    // Also include explicit admin routes
    const standaloneAdmin = path.join(APP_DIR, 'admin');
    if (fs.existsSync(standaloneAdmin)) {
        function walkAdmin(dir: string, base: string) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            const hasPage = entries.some(e => e.isFile() && e.name === 'page.tsx');
            if (hasPage) routes.add(base);
            for (const e of entries) {
                if (e.isDirectory()) walkAdmin(path.join(dir, e.name), `${base}/${e.name}`);
            }
        }
        walkAdmin(standaloneAdmin, '/admin');
    }

    return routes;
}

/** Grep the src directory for hrefs and router.push calls */
function extractNavigationLinks(): Array<{ route: string; file: string; line: number }> {
    const results: Array<{ route: string; file: string; line: number }> = [];

    // Patterns to search for - using ripgrep-style approach with Node
    const patterns = [
        /href=["'`](\/([\w\-\/\[\]]*))['"` ]/g,
        /router\.push\(\s*["'`](\/([\w\-\/\[\]]*))['"` ]/g,
        /router\.replace\(\s*["'`](\/([\w\-\/\[\]]*))['"` ]/g,
        /nativeNavigate\(\s*["'`](\/([\w\-\/\[\]]*))['"` ]/g,
        /redirect\(\s*["'`](\/([\w\-\/\[\]]*))['"` ]/g,
    ];

    function scanFile(filePath: string) {
        let content: string;
        try {
            content = fs.readFileSync(filePath, 'utf-8');
        } catch {
            return;
        }

        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            for (const pattern of patterns) {
                pattern.lastIndex = 0;
                let match: RegExpExecArray | null;
                while ((match = pattern.exec(line)) !== null) {
                    const route = match[1].split('?')[0].split('#')[0]; // Strip query/hash
                    if (route && route !== '/') {
                        results.push({ route, file: filePath, line: idx + 1 });
                    }
                }
            }
        });
    }

    function walkSrc(dir: string) {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }

        for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walkSrc(full);
            } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
                scanFile(full);
            }
        }
    }

    walkSrc(ROOT_DIR);
    return results;
}

export function checkNavigation(): DeadLink[] {
    const localRoutes = buildLocalRouteSet();
    const navLinks = extractNavigationLinks();
    const dead: DeadLink[] = [];

    for (const { route, file, line } of navLinks) {
        // Skip API routes and external/framework paths
        if (IGNORE_ROUTES.has(route)) continue;
        if (DYNAMIC_PREFIXES.some(p => route.startsWith(p))) continue;
        if (route.includes('[') || route.includes('{')) continue; // Dynamic segments

        // Check if route is known
        const routeExists = localRoutes.has(route) ||
            // Allow /admin/* routes broadly since they're in a separate group
            route.startsWith('/admin') ||
            // Allow routes that are dynamic (contain segments we can't statically verify)
            navLinks.some(l => l.route === route && route.includes(':'));

        if (!routeExists) {
            const relFile = path.relative(process.cwd(), file).replace(/\\/g, '/');
            dead.push({ route, file: relFile, line });
        }
    }

    // Deduplicate by route
    const seen = new Set<string>();
    return dead.filter(d => {
        if (seen.has(d.route)) return false;
        seen.add(d.route);
        return true;
    });
}

// Standalone run  
if (require.main === module) {
    console.log('Scanning navigation links...');
    const issues = checkNavigation();
    if (issues.length === 0) {
        console.log('✅  All navigation links point to existing routes.');
    } else {
        console.warn(`\n⚠️  [Navigation Check] ${issues.length} dead navigation link(s) found:\n`);
        for (const { route, file, line } of issues) {
            console.warn(`  • ${route.padEnd(40)} → ${file}:${line}`);
        }
        console.warn('');
    }
}
