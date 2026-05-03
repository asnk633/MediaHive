#!/usr/bin/env node
/**
 * scripts/healthCheck.ts
 *
 * Orchestrates all route health checks. Called by dev.js on startup.
 * Produces a colour-coded console report and writes a machine-readable
 * report to .tmp/route-health.json for CI and tooling.
 *
 * Exit code: 0  (warnings are non-blocking – dev server still starts)
 */

import fs from 'fs';
import path from 'path';
import { checkRoutes } from './checkRoutes';
import { checkApiRoutes } from './checkApiRoutes';
import { checkNavigation } from './checkNavigation';

// ── ANSI colours ─────────────────────────────────────────────────────────────
const R = '\x1b[31m';   // red
const Y = '\x1b[33m';   // yellow
const G = '\x1b[32m';   // green
const B = '\x1b[36m';   // cyan (bold)
const D = '\x1b[2m';    // dim
const K = '\x1b[0m';    // reset

function header(title: string) {
    console.log(`\n${B}${'─'.repeat(60)}${K}`);
    console.log(`${B}  🔍  ${title}${K}`);
    console.log(`${B}${'─'.repeat(60)}${K}`);
}

function section(label: string, count: number) {
    const icon = count === 0 ? `${G}✅` : `${Y}⚠️ `;
    console.log(`\n${icon}  ${label} — ${count === 0 ? 'all clear' : `${count} issue(s)`}${K}`);
}

async function main() {
    header('MediaHive Route & Navigation Health Check');

    console.log(`${D}  Scanning src/app for route gaps...${K}`);

    const [missingPages, missingApiRoutes, deadLinks] = await Promise.all([
        Promise.resolve(checkRoutes()),
        Promise.resolve(checkApiRoutes()),
        Promise.resolve(checkNavigation()),
    ]);

    const totalIssues = missingPages.length + missingApiRoutes.length + deadLinks.length;

    // ── A) Missing page.tsx ───────────────────────────────────────────────────
    section('A) Routes missing page.tsx', missingPages.length);
    if (missingPages.length > 0) {
        for (const { route, absPath } of missingPages) {
            const rel = path.relative(process.cwd(), absPath).replace(/\\/g, '/');
            console.log(`     ${Y}•${K} ${route.padEnd(36)} ${D}→ ${rel}${K}`);
        }
    }

    // ── B) Missing route.ts ───────────────────────────────────────────────────
    section('B) API folders missing route.ts', missingApiRoutes.length);
    if (missingApiRoutes.length > 0) {
        for (const { apiPath, absPath } of missingApiRoutes) {
            const rel = path.relative(process.cwd(), absPath).replace(/\\/g, '/');
            console.log(`     ${Y}•${K} /api${apiPath.padEnd(32)} ${D}→ ${rel}${K}`);
        }
    }

    // ── C) Dead navigation links ──────────────────────────────────────────────
    section('C) Dead navigation links', deadLinks.length);
    if (deadLinks.length > 0) {
        for (const { route, file, line } of deadLinks) {
            console.log(`     ${R}•${K} ${route.padEnd(36)} ${D}→ ${file}:${line}${K}`);
        }
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log(`\n${B}${'─'.repeat(60)}${K}`);
    if (totalIssues === 0) {
        console.log(`${G}  ✅  Route health: CLEAN — no issues found.${K}`);
    } else {
        console.log(`${Y}  ⚠️  Route health: ${totalIssues} total issue(s) found.${K}`);
        console.log(`${D}     Dev server will still start — these are warnings only.${K}`);
    }
    console.log(`${B}${'─'.repeat(60)}${K}\n`);

    // ── Write JSON report ─────────────────────────────────────────────────────
    try {
        const tmpDir = path.resolve(process.cwd(), '.tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                total: totalIssues,
                missingPages: missingPages.length,
                missingApiRoutes: missingApiRoutes.length,
                deadLinks: deadLinks.length,
            },
            missingPages,
            missingApiRoutes,
            deadLinks,
        };

        fs.writeFileSync(
            path.join(tmpDir, 'route-health.json'),
            JSON.stringify(report, null, 2)
        );
        console.log(`${D}  Report saved to .tmp/route-health.json${K}\n`);
    } catch {
        // Non-critical
    }
}

main().catch(console.error);
