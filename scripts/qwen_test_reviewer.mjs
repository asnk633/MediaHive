import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
const MODEL = 'qwen2.5-coder:latest';

async function reviewTestFile(filePath) {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(ROOT_DIR, filePath);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File not found: ${absolutePath}`);
    return null;
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const fileBasename = path.basename(absolutePath);

  console.log(`🤖 Requesting Qwen review for: ${fileBasename}...`);

  const prompt = `You are a senior QA architect. Review this Playwright E2E test file for a Next.js + Supabase app.
Look for:
1. Selector accuracy (e.g. prioritize data-testid, check if standard CSS selectors look brittle)
2. Hardcoded credentials (should throw or use env vars)
3. Stale session/cache clearing
4. Flaky waitForTimeout or bad async waits
5. Clean data isolation (no shared mutations without cleanup)
6. Proper DB cleanup logic (cascade deletes, children before parents)
7. Logic bugs or typos

Test Code to Review:
\`\`\`typescript
${content}
\`\`\`

Output ONLY a single valid JSON object. Do not wrap in markdown or add explanations. The output MUST match this schema:
{
  "file": "${fileBasename}",
  "issues": [
    {
      "severity": "error|warning|info",
      "line": 42,
      "description": "Short explanation of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "autoFixable": false,
  "selectorAccuracy": "high|medium|low"
}`;

  const payload = {
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    format: 'json',
    options: { temperature: 0.1, num_ctx: 16000 },
    stream: false
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const res = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Ollama API error: ${res.statusText}`);
    const data = await res.json();
    const resultJson = JSON.parse(data.message.content.trim());
    return resultJson;
  } catch (e) {
    clearTimeout(timeout);
    console.error(`❌ Qwen review failed for ${fileBasename}:`, e.message);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node scripts/qwen_test_reviewer.mjs <path_to_test_file>');
    process.exit(1);
  }

  const filePath = args[0];
  const review = await reviewTestFile(filePath);

  if (review) {
    console.log(JSON.stringify(review, null, 2));
    if (review.issues && review.issues.length > 0) {
      console.log(`\n⚠️  Found ${review.issues.length} issues in ${review.file}.`);
      process.exit(0);
    } else {
      console.log(`\n✅ No issues found in ${review.file}.`);
      process.exit(0);
    }
  } else {
    process.exit(1);
  }
}

// Run main if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
