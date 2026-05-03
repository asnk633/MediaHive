// scripts/fix-profiles-rls.cjs
// Fix infinite recursion in profiles RLS.
// Drops all existing profiles policies and recreates a safe, single-table SELECT policy.
'use strict';

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.');
    process.exit(1);
}

const https = require('https');
const url = require('url');

// Use Supabase's postgres REST endpoint to run raw SQL via the service role.
// We can call supabase.rpc('exec_sql', ...) but that function may not exist.
// Instead we POST to /rest/v1/rpc/exec_sql or use the Management API.
// The simplest guaranteed approach: POST raw SQL via the pg connection string.

// Actually the cleanest way without needing pg driver: use supabase-js v2 with the service key
// to call a postgres function. But we have supabase-js installed.
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
    db: { schema: 'public' },
});

const SQL_STEPS = [
    // ── Step 1: Drop all known policy variants ──────────────────────────────
    {
        label: 'Drop policy: "profiles select"',
        sql: `drop policy if exists "profiles select" on public.profiles`
    },
    {
        label: 'Drop policy: "profiles insert"',
        sql: `drop policy if exists "profiles insert" on public.profiles`
    },
    {
        label: 'Drop policy: "profiles update"',
        sql: `drop policy if exists "profiles update" on public.profiles`
    },
    {
        label: 'Drop policy: "profiles delete"',
        sql: `drop policy if exists "profiles delete" on public.profiles`
    },
    {
        label: 'Drop policy: "profiles select own"',
        sql: `drop policy if exists "profiles select own" on public.profiles`
    },
    {
        label: 'Drop policy: "profiles by institution"',
        sql: `drop policy if exists "profiles by institution" on public.profiles`
    },
    // Extra names that might exist from earlier migrations
    {
        label: 'Drop policy: "profiles_select_own" (snake_case variant)',
        sql: `drop policy if exists "profiles_select_own" on public.profiles`
    },
    {
        label: 'Drop policy: "allow_own_profile"',
        sql: `drop policy if exists "allow_own_profile" on public.profiles`
    },

    // ── Step 2: Enable RLS ───────────────────────────────────────────────────
    {
        label: 'Enable RLS on profiles',
        sql: `alter table public.profiles enable row level security`
    },

    // ── Step 3: Safe SELECT policy — no subqueries, no self-reference ────────
    {
        label: 'Create safe SELECT policy',
        sql: `create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid())` },
];

async function execSQL(label, sql) {
    // Use supabase-js rpc to call pg_catalog.current_setting as a connectivity check,
    // then use postgres REST endpoint for raw DDL.
    // For DDL statements, we need to use the Supabase Management API or a pg connection.
    // Supabase exposes a /rest/v1/sql endpoint (v2 beta) — let's try that first,
    // then fall back to the management API.

    return new Promise((resolve, reject) => {
        const parsed = new url.URL(supabaseUrl);
        const body = JSON.stringify({ query: sql });

        const options = {
            hostname: parsed.hostname,
            port: 443,
            path: '/rest/v1/sql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'Authorization': `Bearer ${serviceKey}`,
                'apikey': serviceKey,
                'Prefer': 'return=minimal',
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ ok: true, status: res.statusCode, body: data });
                } else {
                    resolve({ ok: false, status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

(async () => {
    console.log(`\n🔧 Fixing profiles RLS — connected to: ${supabaseUrl}\n`);

    let allPassed = true;

    for (const step of SQL_STEPS) {
        process.stdout.write(`  ${step.label} ... `);
        try {
            const result = await execSQL(step.label, step.sql);
            if (result.ok) {
                console.log('✅');
            } else {
                // /rest/v1/sql may not be available; parse the error
                let errBody = '';
                try { errBody = JSON.parse(result.body)?.message || result.body; } catch { errBody = result.body; }

                if (result.status === 404 || errBody.includes('not found')) {
                    // Endpoint not available in this Supabase version — fall through to advisory
                    console.log(`⚠️  (HTTP ${result.status} — /rest/v1/sql not exposed; run manually)`);
                    allPassed = false;
                } else {
                    console.log(`❌  (HTTP ${result.status}: ${errBody.slice(0, 120)})`);
                    allPassed = false;
                }
            }
        } catch (err) {
            console.log(`❌  (${err.message})`);
            allPassed = false;
        }
    }

    // ── Verify: list current policies on profiles ─────────────────────────
    console.log('\n📋 Verifying current policies on public.profiles...');
    const verifySQL = `
    select policyname, cmd, qual
    from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
    order by policyname
  `;
    const verifyResult = await execSQL('Verify policies', verifySQL);
    if (verifyResult.ok) {
        let policies = [];
        try { policies = JSON.parse(verifyResult.body); } catch { }
        if (policies.length === 0) {
            console.log('  → No policies remain (safe — RLS still blocks unauthenticated access when enabled).');
        } else {
            policies.forEach(p => {
                const selfRef = (p.qual || '').includes('profiles');
                console.log(`  → ${p.policyname} (${p.cmd}): ${p.qual} ${selfRef ? '⚠️  SELF-REFERENCE DETECTED' : '✅'}`);
            });
        }
    } else {
        console.log('  ⚠️  Could not verify via REST — check Supabase dashboard > Table Editor > RLS policies on profiles.');
    }

    // ── RLS status ────────────────────────────────────────────────────────
    const rlsSQL = `select relname, relrowsecurity from pg_class where relname = 'profiles' and relnamespace = 'public'::regnamespace`;
    const rlsResult = await execSQL('RLS status', rlsSQL);
    if (rlsResult.ok) {
        let rows = [];
        try { rows = JSON.parse(rlsResult.body); } catch { }
        const rlsOn = rows[0]?.relrowsecurity;
        console.log(`\n🔒 RLS enabled on profiles: ${rlsOn ? '✅ YES' : '❌ NO'}`);
    }

    if (!allPassed) {
        console.log('\n──────────────────────────────────────────────────────────');
        console.log('⚠️  Some steps could not be executed automatically.');
        console.log('   The /rest/v1/sql endpoint is not exposed on your Supabase plan.');
        console.log('   Please run the SQL below in the Supabase SQL Editor:\n');
        console.log('   https://supabase.com/dashboard/project/_/sql/new\n');
        SQL_STEPS.forEach(s => console.log('   ' + s.sql + ';\n'));
        process.exit(1);
    } else {
        console.log('\n✅ All done. Profiles RLS is now safe.\n');
    }
})();
