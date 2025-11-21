#!/usr/bin/env node
/**
 * Orchestrator for local perf audits.
 * - Runs lighthouse
 * - Runs autocannon
 * - Runs Playwright perf tests (if configured)
 * - Produces artifacts in reports/performance/<YYYY-MM-DD>/
 *
 * Usage:
 *   node scripts/audit/full-audit.js [--ci] [--baseUrl=http://localhost:3000] [--with-seed]
 */

const { spawnSync, spawn } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const dayjs = require("dayjs");
const minimist = require("minimist");

const argv = minimist(process.argv.slice(2));
const CI = argv.ci || false;
const BASE_URL = argv.baseUrl || process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || "http://localhost:3000";
const OUT_ROOT = path.resolve(process.cwd(), "reports", "performance", dayjs().format("YYYY-MM-DD"));
const OUT_LATEST = path.resolve(process.cwd(), "reports", "performance", "latest");

fs.ensureDirSync(OUT_ROOT);
fs.ensureDirSync(OUT_LATEST);

function runCommandSync(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const res = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (res.status !== 0) {
    console.warn(`[WARN] Command failed: ${cmd} ${args.join(" ")}`);
    return false;
  }
  return true;
}

async function runLighthouse() {
  // Use the wrapper script which will create JSON + HTML outputs
  const wrapper = path.join(process.cwd(), "scripts", "audit", "run-lighthouse.sh");
  const outHtml = path.join(OUT_ROOT, "lighthouse.html");
  const outJson = path.join(OUT_ROOT, "lighthouse.json");
  const args = [BASE_URL, outHtml, outJson];
  console.log("Running Lighthouse...");
  const ok = runCommandSync("bash", [wrapper, ...args], { env: process.env });
  return ok ? { html: outHtml, json: outJson } : null;
}

async function runAutocannon() {
  console.log("Running autocannon...");
  const out = path.join(OUT_ROOT, "autocannon.json");
  const p = spawn(process.execPath, [path.join(process.cwd(), "scripts", "audit", "run-autocannon.js"), "--url", `${BASE_URL}/api/tasks`, "--duration", "6", "--connections", "20", "--output", out], { stdio: "inherit" });
  return new Promise((resolve) => {
    p.on("exit", (code) => {
      if (code === 0 && fs.existsSync(out)) {
        resolve(out);
      } else {
        resolve(null);
      }
    });
  });
}

async function runPlaywrightPerf() {
  console.log("Running Playwright tests (if available)...");
  try {
    const res = spawnSync("npx", ["playwright", "test", "--config=playwright.config.cjs", "--reporter=json", "--output", path.join(OUT_ROOT, "playwright-output")], { stdio: "inherit" });
    if (res.status === 0) {
      // try to find the json report
      const jsonPath = path.join(OUT_ROOT, "playwright-output", "report.json");
      // playwright default JSON path may vary; we'll just copy the directory
      await fs.copy(path.join(process.cwd(), "test-results"), path.join(OUT_ROOT, "playwright-test-results")).catch(()=>{});
      return true;
    }
  } catch (e) {
    console.warn("Playwright perf run failed:", e.message);
  }
  return false;
}

async function runBundleAnalysis() {
  console.log("Running bundle analysis...");
  // If Next.js, we will run `next build` then analyze .next static/chunks
  try {
    runCommandSync("npx", ["next", "build"]);
    // try to locate source maps / chunks - use source-map-explorer on the largest chunk
    // Qoder: pick a few likely files
    const staticDir = path.join(process.cwd(), ".next", "static", "chunks");
    if (!fs.existsSync(staticDir)) {
      console.warn(".next/static/chunks not found; skipping bundle analysis");
      return null;
    }
    const files = fs.readdirSync(staticDir).filter(f => f.endsWith(".js"));
    const candidate = files.find(f => f.includes("pages/")) || files[0];
    if (!candidate) return null;
    const candidatePath = path.join(staticDir, candidate);
    const out = path.join(OUT_ROOT, `bundle-${candidate}.html`);
    runCommandSync("npx", ["source-map-explorer", candidatePath, "--html", out]);
    return out;
  } catch (e) {
    console.warn("Bundle analysis failed:", e.message);
    return null;
  }
}

async function generateSummary(artifacts) {
  console.log("Generating summary...");
  const gen = path.join(process.cwd(), "scripts", "audit", "generate-summary.js");
  runCommandSync("node", [gen, OUT_ROOT]);
  // copy summary to latest
  const summarySrc = path.join(OUT_ROOT, "summary.md");
  if (fs.existsSync(summarySrc)) {
    fs.copySync(summarySrc, path.join(OUT_LATEST, "summary.md"));
  }
}

(async () => {
  console.log("Performance audit starting. BASE_URL =", BASE_URL);
  const results = {};
  try {
    const lh = await runLighthouse();
    if (lh) results.lighthouse = lh;
    const ac = await runAutocannon();
    if (ac) results.autocannon = ac;
    await runPlaywrightPerf();
    const bundle = await runBundleAnalysis();
    if (bundle) results.bundle = bundle;
    await generateSummary(results);
    console.log("\nAudit complete. Artifacts placed in:", OUT_ROOT);
    console.log("Latest report copied to:", OUT_LATEST);
    process.exit(0);
  } catch (e) {
    console.error("Audit failed:", e.message);
    process.exit(1);
  }
})();