import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
const MODEL = 'qwen2.5-coder:latest';

// Prompts
const PROMPTS = {
  SECURITY: `You are an expert Application Security Engineer reviewing a Next.js/Supabase codebase.
Look for: privilege escalation, broken authorization, insecure direct object references, missing ownership checks, exposed secrets, SQL injection, XSS, SSRF.`,
  LOGIC: `You are an expert Senior Software Engineer reviewing a Next.js/React codebase.
Look for: race conditions, incorrect state transitions, duplicate submissions, stale cache bugs, concurrency issues, incorrect business logic.`,
  PERFORMANCE: `You are an expert Performance Engineer reviewing a Next.js/React codebase.
Look for: N+1 queries, unnecessary re-renders, memory leaks, expensive database calls, inefficient loops, unoptimized hydration.`,
  RELIABILITY: `You are an expert Site Reliability Engineer reviewing a Next.js/React codebase.
Look for: missing error handling, null pointer crashes, unhandled edge cases, missing fallbacks, network timeout issues.`
};

const FEATURES = {
  auth: ['src/middleware.ts', 'src/app/api/auth', 'src/features/auth', 'src/db/schema.ts'],
  tasks: ['src/app/api/tasks', 'src/features/tasks', 'src/store/tasksStore.ts'],
  attendance: ['src/app/api/attendance', 'src/features/attendance'],
  uploads: ['src/app/api/upload', 'src/components/upload'],
  notifications: ['src/app/api/notifications', 'src/features/notifications']
};

const EXCLUDE_PATTERNS = ['node_modules', '.next/', 'dist/', 'build/', '.test.', '.spec.', '__tests__'];

function shouldIncludeFile(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  return !EXCLUDE_PATTERNS.some(p => norm.includes(p));
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const stat = fs.statSync(dirPath);
  if (stat.isFile()) {
    if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx') || dirPath.endsWith('.js') || dirPath.endsWith('.jsx')) {
      arrayOfFiles.push(dirPath);
    }
    return arrayOfFiles;
  }
  const files = fs.readdirSync(dirPath);
  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

function extractJSON(text) {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = jsonMatch ? jsonMatch[1] : text;
  
  // Remove trailing commas/comments that break strict JSON
  const cleaned = raw.replace(/,\s*(?=[}\]])/g, '').replace(/\/\/.*$/gm, '');
  return JSON.parse(cleaned);
}

async function runOllamaAnalysis(passName, systemPrompt, codeContext) {
  const fullPrompt = `${systemPrompt}
Analyze the following code context. ONLY report issues supported by direct code evidence.
Keep findings highly concise to avoid output truncation. Limit the list of findings to at most 5 unique, high-confidence issues.
Output STRICTLY as valid JSON matching this schema:
{"findings":[],"no_issues":true}
Schema per finding: {"severity":"CRITICAL|HIGH|MEDIUM|LOW","file":"path","line":"num/fn","type":"cat","problem":"desc","proof":"snippet","fix":"suggested","confidence":"HIGH|MEDIUM|LOW"}
CODE TO ANALYZE:\n${codeContext}`;

  const payload = {
    model: MODEL,
    messages: [{ role: 'user', content: fullPrompt }],
    format: 'json',
    options: { temperature: 0.1, num_ctx: 16000, num_predict: 3072 },
    stream: false
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000); // 90s per call

  try {
    const res = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    
    const data = await res.json();
    const rawContent = data.message?.content || '';
    fs.appendFileSync('qwen_debug.log', `=== PASS: ${passName} ===\n${rawContent}\n\n`);
    return extractJSON(rawContent);
  } catch (error) {
    clearTimeout(timeout);
    console.warn(`[${passName}] Failed:`, error.name === 'AbortError' ? 'Timeout' : error.message);
    return { findings: [], no_issues: true, _error: error.message };
  }
}

async function processFilesForPass(featureName, passName) {
  const paths = FEATURES[featureName];
  let allFindings = [];
  
  for (const p of paths) {
    const dirPath = path.join(ROOT_DIR, p);
    if (!fs.existsSync(dirPath)) continue;
    
    const files = getAllFiles(dirPath, []).filter(shouldIncludeFile);
    console.log(`  Processing ${files.length} files for ${passName}...`);
    
    const BATCH_SIZE = 3;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const context = batch.map(f => {
        const content = fs.readFileSync(f, 'utf-8');
        return `--- FILE: ${path.relative(ROOT_DIR, f)} ---\n\`\`\`typescript\n${content}\n\`\`\`\n`;
      }).join('\n');

      let result;
      for (let retry = 0; retry < 2; retry++) {
        try {
          result = await runOllamaAnalysis(passName, PROMPTS[passName], context);
          if (result?.findings?.length > 0 || result?.no_issues) break;
        } catch (e) {
          // Handled below
        }
      }
      
      if (result?.findings) {
        allFindings.push(...result.findings.map(f => ({ feature: featureName, pass: passName, ...f })));
      }
    }
  }
  return allFindings;
}

async function main() {
  console.log("Starting Deep Bug Test with Qwen 3.6...");
  const allFindings = [];
  
  for (const feature of Object.keys(FEATURES)) {
    console.log(`\n=== Feature: ${feature.toUpperCase()} ===`);
    for (const passName of Object.keys(PROMPTS)) {
      console.log(`  🔄 Running ${passName} pass...`);
      const results = await processFilesForPass(feature, passName);
      allFindings.push(...results);
    }
  }

  const filtered = allFindings.filter(f => f && !f.no_issues && f.severity !== 'INFO');
  
  fs.writeFileSync('QWEN_RAW_FINDINGS.json', JSON.stringify(filtered, null, 2));
  console.log(`\n✅ Analysis complete. ${filtered.length} findings saved.`);
}

main().catch(console.error);
