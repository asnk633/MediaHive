#!/usr/bin/env node

/**
 * React Server Components (RSC) Audit Script
 * Uses local Ollama model (qwen2.5-coder:latest) to analyze Next.js codebase for RSC best practices.
 */

import fs from 'fs';
import path from 'path';

const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
const MODEL = 'qwen2.5-coder:latest';
const REPORT_FILE = 'RSC_AUDIT_REPORT.json';

const TARGET_DIRS = ['src/components/admin', 'src/components/activity'];
const EXTENSIONS = ['.tsx', '.ts'];

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else {
      if (EXTENSIONS.includes(path.extname(filePath))) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const auditPrompt = `You are a Next.js App Router performance and architecture expert.
Analyze the following React component file for React Server Components (RSC) best practices.

Specifically look for:
1. Unnecessary "use client" directives (e.g., component has no hooks like useState/useEffect, no browser APIs, no event listeners).
2. Large or non-serializable props passed from Server to Client components.
3. Missing opportunities to fetch data on the server instead of the client.
4. Client components importing heavy server-side libraries.

Respond ONLY with a valid JSON array of objects representing the violations. If no violations are found, return an empty array [].
Each object must have the following format:
{
  "type": "unnecessary_use_client" | "large_client_props" | "client_data_fetch" | "boundary_leak" | "other",
  "description": "Short explanation of why this is a violation and how to fix it."
}

Do not include markdown blocks like \`\`\`json around the array. Just return the raw JSON array.

File Content:
`;

async function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: 'You are a strict JSON-only API. You must return only a valid JSON array.' },
      { role: 'user', content: auditPrompt + content }
    ],
    stream: false,
    options: {
      temperature: 0.1
    }
  };

  try {
    const res = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    let text = data.message.content.trim();
    
    // Clean up potential markdown formatting from the response
    if (text.startsWith('\`\`\`json')) text = text.replace(/^\`\`\`json/m, '');
    if (text.startsWith('\`\`\`')) text = text.replace(/^\`\`\`/m, '');
    if (text.endsWith('\`\`\`')) text = text.replace(/\`\`\`$/m, '');
    text = text.trim();

    const result = JSON.parse(text);
    return Array.isArray(result) ? result : [];
  } catch (err) {
    return [{ type: "error", description: "Agent failed to parse file or return valid JSON. Error: " + err.message }];
  }
}

async function runAudit() {
  console.log('🔍 Starting React Server Components (RSC) Audit via local Qwen agent...\\n');
  
  let filesToAudit = [];
  for (const dir of TARGET_DIRS) {
    filesToAudit = filesToAudit.concat(getFiles(dir));
  }
  
  console.log(`Found ${filesToAudit.length} files to scan in ${TARGET_DIRS.join(', ')}.\\n`);
  
  const report = {};
  let processed = 0;
  
  for (const file of filesToAudit) {
    processed++;
    process.stdout.write(`[${processed}/${filesToAudit.length}] Analyzing ${file}... `);
    
    const issues = await analyzeFile(file);
    
    if (issues.length > 0 && issues[0].type !== "error") {
      console.log(`❌ Found ${issues.length} issue(s)`);
      report[file] = issues;
    } else if (issues.length > 0 && issues[0].type === "error") {
      console.log(`⚠️  Error`);
    } else {
      console.log(`✅ OK`);
    }
  }
  
  console.log(`\\n✅ Audit complete. Found issues in ${Object.keys(report).length} files.`);
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`Report saved to ${REPORT_FILE}`);
}

runAudit();
