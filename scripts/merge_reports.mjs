import fs from 'fs';
import path from 'path';

const QWEN_FILE = 'QWEN_RAW_FINDINGS.json';
const SEMGREP_FILE = 'SEMGREP_FINDINGS.json';

function loadJson(file) {
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (e) {
      console.error(`Error parsing ${file}:`, e.message);
    }
  }
  return null;
}

function normalizeFindings() {
  const merged = [];
  const seen = new Set();

  // Load Qwen findings
  const qwenData = loadJson(QWEN_FILE) || [];
  qwenData.forEach(f => {
    const key = `${f.file}:${f.line}:${f.type}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({
        source: 'Qwen 3.6',
        severity: f.severity || 'MEDIUM',
        file: f.file,
        line: f.line,
        type: f.type,
        problem: f.problem,
        proof: f.proof,
        fix: f.fix,
        confidence: f.confidence || 'MEDIUM'
      });
    }
  });

  // Load Semgrep findings
  const semgrepData = loadJson(SEMGREP_FILE);
  if (semgrepData && Array.isArray(semgrepData.results)) {
    semgrepData.results.forEach(r => {
      const key = `${r.path}:${r.start?.line || 'unknown'}:${r.check_id}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push({
          source: 'Semgrep',
          severity: r.extra?.severity === 'ERROR' ? 'HIGH' : (r.extra?.severity === 'WARNING' ? 'MEDIUM' : 'LOW'),
          file: r.path,
          line: r.start?.line || 'unknown',
          type: r.check_id,
          problem: r.extra?.message || 'Semgrep warning',
          proof: r.extra?.lines || '',
          fix: r.extra?.metadata?.fix || 'Review code logic',
          confidence: 'HIGH' // Semgrep is deterministic
        });
      }
    });
  }

  return merged;
}

function generateRiskMatrix(findings) {
  const matrix = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };

  findings.forEach(f => {
    const sev = f.severity.toUpperCase();
    if (matrix[sev] !== undefined) {
      matrix[sev]++;
    }
  });

  const content = `# Security Risk Matrix

| Severity | Count |
| --- | --- |
| **CRITICAL** | ${matrix.CRITICAL} |
| **HIGH** | ${matrix.HIGH} |
| **MEDIUM** | ${matrix.MEDIUM} |
| **LOW** | ${matrix.LOW} |

## Target Distribution by Source
- Qwen 3.6 findings: ${findings.filter(f => f.source === 'Qwen 3.6').length}
- Semgrep findings: ${findings.filter(f => f.source === 'Semgrep').length}
`;

  fs.writeFileSync('RISK_MATRIX.md', content);
  console.log('✅ Generated RISK_MATRIX.md');
}

function generateBugReport(findings) {
  let content = `# Comprehensive Bug Audit Report\n\n`;
  content += `This report compiles findings from local static analysis tools (Semgrep) and LLM-based verification (Qwen 3.6).\n\n`;

  const sorted = findings.sort((a, b) => {
    const sevs = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return (sevs[b.severity.toUpperCase()] || 0) - (sevs[a.severity.toUpperCase()] || 0);
  });

  sorted.forEach((f, idx) => {
    content += `### Finding #${idx + 1}: [${f.severity}] ${f.type} (${f.source})\n\n`;
    content += `- **File:** \`${f.file}\`\n`;
    content += `- **Line/Function:** \`${f.line}\`\n`;
    content += `- **Confidence:** \`${f.confidence}\`\n\n`;
    content += `#### Problem\n${f.problem}\n\n`;
    content += `#### Proof / Evidence\n\`\`\`typescript\n${f.proof}\n\`\`\`\n\n`;
    content += `#### Suggested Fix\n${f.fix}\n\n`;
    content += `---\n\n`;
  });

  fs.writeFileSync('BUG_REPORT.md', content);
  console.log('✅ Generated BUG_REPORT.md');
}

function main() {
  console.log('Merging reports...');
  const normalized = normalizeFindings();
  generateRiskMatrix(normalized);
  generateBugReport(normalized);
}

main();
