#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
const MODEL = 'qwen2.5-coder:latest';
const PLAN_FILE = 'C:\\Users\\Shukoor Rahman\\.gemini\\antigravity\\brain\\0212be51-fbfd-424c-ab8e-b0bcee8a6da3\\implementation_plan.md';

const auditPrompt = `You are a Senior Three.js and WebGL Performance Expert.
Please review the following implementation plan for optimizing a Three.js marketing site.

Your task is to provide a concise, expert review of the proposed optimization strategies (specifically around IntersectionObserver for pausing off-screen renders and video texture optimizations).
Point out any potential pitfalls with GSAP ScrollTrigger if render loops are paused, and whether the plan makes sense.

Plan Content:
`;

async function analyzePlan() {
  const content = fs.readFileSync(PLAN_FILE, 'utf-8');
  
  const payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: 'You are a helpful expert reviewer.' },
      { role: 'user', content: auditPrompt + content }
    ],
    stream: false,
    options: {
      temperature: 0.2
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
    console.log('\n--- QWEN REVIEW ---');
    console.log(data.message.content.trim());
    console.log('-------------------\n');
  } catch (err) {
    console.error("Failed to connect to local Qwen model:", err.message);
  }
}

analyzePlan();
