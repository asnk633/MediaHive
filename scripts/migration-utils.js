/**
 * scripts/migration-utils.js
 * 
 * Standardized migration runner with dry-run support.
 * Usage: node scripts/your-migration.js --dry-run
 */

const { getFirebaseAdminDb } = require('../src/firebase/admin-script-shim'); // Assume shim exists or we direct import if TS-node used
// Actually, since this is JS script running in node, we might need a distinct admin init or reuse existing one if possible.
// For simplicity in this environment, we'll mock the runner structure or use a placeholder if the DB init is complex.
// But we saw 'scripts/check-envs.js' etc., suggesting direct node execution.

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

async function runMigration(name, upFn) {
    console.log(`[${name}] Starting migration... ${isDryRun ? '(DRY RUN)' : ''}`);

    try {
        if (isDryRun) {
            console.log(`[${name}] Dry run active. Executing logic without commit...`);
            await upFn({ dryRun: true });
            console.log(`[${name}] Dry run complete. No changes applied.`);
        } else {
            console.log(`[${name}] Executing migration...`);
            await upFn({ dryRun: false });
            console.log(`[${name}] Migration applied successfully.`);
        }
    } catch (error) {
        console.error(`[${name}] Migration FAILED:`, error);
        process.exit(1);
    }
}

module.exports = { runMigration, isDryRun };
