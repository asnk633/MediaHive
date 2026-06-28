import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
const MODEL = 'qwen2.5-coder:latest';

async function main() {
  console.log("Reading RLS Audit Report...");
  const auditPath = 'C:\\Users\\Shukoor Rahman\\.gemini\\antigravity\\brain\\7aaabb56-7321-416e-93a6-c109a101bb54\\supabase_rls_audit.md';
  if (!fs.existsSync(auditPath)) {
    console.error("Audit report not found at:", auditPath);
    return;
  }
  
  const auditContent = fs.readFileSync(auditPath, 'utf-8');
  
  const prompt = `You are a senior PostgreSQL and Supabase Database Administrator. Review the following Row Level Security (RLS) security audit report and write a single, clean PostgreSQL SQL migration script to fix all identified vulnerabilities (Cross-Tenant leaks, Hardcoded UUID bypasses, and Tenant-Wide task write escalations).

Use standard Supabase helper functions like auth.uid() or get_auth_tenant_id() where appropriate.
Provide ONLY the SQL commands, formatted inside a standard sql code block. Do not write explanations outside the SQL block.

AUDIT REPORT:
${auditContent}`;

  const payload = {
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    options: { temperature: 0.1, num_ctx: 16000 },
    stream: false
  };

  console.log("Querying Qwen 3.6 for SQL fixes...");
  try {
    const res = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error(`Ollama API error: ${res.statusText}`);
    const data = await res.json();
    const sqlContent = data.message.content;
    
    fs.writeFileSync('supabase_rls_fixes.sql', sqlContent);
    console.log("✅ SQL fixes written to supabase_rls_fixes.sql");
  } catch (e) {
    console.error("Failed to query Qwen 3.6:", e.message);
  }
}

main().catch(console.error);
