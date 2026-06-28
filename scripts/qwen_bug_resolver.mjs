import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
const MODEL = 'qwen2.5-coder:latest';

function loadFindings() {
  if (fs.existsSync('QWEN_RAW_FINDINGS.json')) {
    const raw = fs.readFileSync('QWEN_RAW_FINDINGS.json', 'utf-8');
    try {
      const data = JSON.parse(raw);
      data.forEach(f => {
        if (f.file) {
          f.file = f.file
            .replace(/\t/g, '/t')
            .replace(/\n/g, '/n')
            .replace(/\r/g, '/r')
            .replace(/\\/g, '/');
        }
      });
      return data;
    } catch (e) {
      console.error("Error parsing QWEN_RAW_FINDINGS.json:", e.message);
    }
  }
  return [];
}

async function queryQwenForFix(finding, fileContent) {
  const prompt = `You are a senior software engineer. Fix the following bug in the code.
  
BUG FINDING:
Severity: ${finding.severity}
File: ${finding.file}
Line/Function: ${finding.line}
Problem: ${finding.problem}
Proof: ${finding.proof}

Output a JSON object containing the exact code target to replace and its replacement content. Do not include any other text, only valid JSON matching this schema:
{
  "targetContent": "the exact lines of code from the original file that contain the bug",
  "replacementContent": "the corrected lines of code that fix the bug"
}

Ensure the "targetContent" matches the existing code exactly, including leading spaces/tabs.

CODE:
\`\`\`typescript
${fileContent}
\`\`\``;

  const payload = {
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    format: 'json',
    options: { temperature: 0.1, num_ctx: 16000 },
    stream: false
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000); // 90s timeout

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
    return JSON.parse(data.message.content);
  } catch (e) {
    clearTimeout(timeout);
    console.error(`Failed to get fix for ${finding.file}:`, e.message);
    return null;
  }
}

function runTypecheck() {
  try {
    execSync('npx tsc --noEmit', { cwd: ROOT_DIR, stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  const findings = loadFindings();
  console.log(`Loaded ${findings.length} findings to resolve.`);

  const fixLog = [];

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    console.log(`\n[${i + 1}/${findings.length}] Resolving ${f.severity} in ${f.file}...`);
    
    // Normalize path
    const targetFile = path.resolve(ROOT_DIR, f.file);
    if (!fs.existsSync(targetFile)) {
      console.warn(`File not found: ${targetFile}, skipping.`);
      continue;
    }

    const fileContent = fs.readFileSync(targetFile, 'utf-8');
    
    console.log(`  Querying Qwen for fix...`);
    const fixResult = await queryQwenForFix(f, fileContent);
    if (!fixResult || !fixResult.targetContent || !fixResult.replacementContent) {
      console.warn(`  Could not obtain valid target/replacement JSON.`);
      continue;
    }

    const { targetContent, replacementContent } = fixResult;
    
    const fileContentNorm = fileContent.replace(/\r\n/g, '\n');
    const targetContentNorm = targetContent.replace(/\r\n/g, '\n');
    const replacementContentNorm = replacementContent.replace(/\r\n/g, '\n');
    
    if (!fileContentNorm.includes(targetContentNorm)) {
      console.warn(`  Warning: Target content not found in file. Skipping.`);
      fs.writeFileSync('failed_match_debug.txt', `TARGET:\n${targetContentNorm}\n\nFILE_CONTENT:\n${fileContentNorm}`);
      continue;
    }

    // Apply replacement
    const newContent = fileContentNorm.replace(targetContentNorm, replacementContentNorm);
    fs.writeFileSync(targetFile, newContent);
    console.log(`  Applied fix to ${f.file}. Running typecheck...`);

    if (runTypecheck()) {
      console.log(`  ✅ Typecheck passed! Fix saved.`);
      fixLog.push({ file: f.file, severity: f.severity, status: 'FIXED', targetContent, replacementContent });
    } else {
      console.warn(`  ❌ Typecheck failed. Rolling back change.`);
      fs.writeFileSync(targetFile, fileContent);
      fixLog.push({ file: f.file, severity: f.severity, status: 'FAILED_TYPECHECK', targetContent, replacementContent });
    }
  }

  fs.writeFileSync('QWEN_FIX_LOG.json', JSON.stringify(fixLog, null, 2));
  console.log('\nBug resolution finished. Log written to QWEN_FIX_LOG.json');
}

main().catch(console.error);
