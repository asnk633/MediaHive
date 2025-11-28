// tools/run_test_env.js
// Usage: node tools/run_test_env.js
// This script starts an ephemeral firestore test environment and opens a REPL
// exposing `testEnv`, `adminDb`, `aliceDb`, etc for interactive debug.

import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import fs from "fs";
import path from "path";
import repl from "repl";

async function main() {
    const rulesPath = path.resolve(process.cwd(), "firestore.rules");
    const rules = fs.existsSync(rulesPath) ? fs.readFileSync(rulesPath, "utf8") : null;

    if (!rules) {
        console.error("No firestore.rules found in repo root. Create one and try again.");
        process.exit(1);
    }

    const testEnv = await initializeTestEnvironment({
        projectId: "thaiba-repl",
        firestore: { rules }
    });

    console.log("Test environment started. Creating some contexts...");

    const adminCtx = testEnv.authenticatedContext("admin", { uid: "admin" });
    const aliceCtx = testEnv.authenticatedContext("alice", { uid: "alice" });
    const anonCtx = testEnv.unauthenticatedContext();

    const adminDb = adminCtx.firestore();
    const aliceDb = aliceCtx.firestore();
    const anonDb = anonCtx.firestore();

    // seed a role doc so admin can write
    await adminDb.collection("roles").doc("admin").set({ role: "admin", tags: [] });

    console.log("Seeded admin role. Available variables in REPL: testEnv, adminDb, aliceDb, anonDb");
    console.log("Remember to call await testEnv.cleanup() when done.");

    const serverRepl = repl.start({
        prompt: "firestore-test> ",
        useGlobal: true,
        ignoreUndefined: true
    });

    // expose objects to REPL context
    serverRepl.context.testEnv = testEnv;
    serverRepl.context.adminDb = adminDb;
    serverRepl.context.aliceDb = aliceDb;
    serverRepl.context.anonDb = anonDb;
    serverRepl.context.seedRoles = async (roles) => {
        const writes = [];
        for (const uid of Object.keys(roles)) {
            writes.push(adminDb.collection("roles").doc(uid).set(roles[uid]));
        }
        await Promise.all(writes);
        return true;
    };

    // when REPL exits, cleanup testEnv
    serverRepl.on("exit", async () => {
        console.log("Cleaning up test environment...");
        await testEnv.cleanup();
        process.exit(0);
    });
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
