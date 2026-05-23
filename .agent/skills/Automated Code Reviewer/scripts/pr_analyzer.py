#!/usr/bin/env python3
"""
PR Analyzer
Automated tool for code reviewer tasks that analyzes a Pull Request or a local branch/files
for common issues, styling violations, database safety (RLS), and structural constraints.
"""

import os
import sys
import json
import argparse
import re
from pathlib import Path
from typing import Dict, List, Optional

class PrAnalyzer:
    """Main class for PR Analyzer functionality"""
    
    def __init__(self, target_path: str, verbose: bool = False):
        self.target_path = Path(target_path)
        self.verbose = verbose
        self.results = {}
        self.findings = []
    
    def run(self) -> Dict:
        """Execute the main functionality"""
        print(f"🚀 Running {self.__class__.__name__}...")
        print(f"📁 Target: {self.target_path}")
        
        try:
            self.validate_target()
            self.analyze()
            self.generate_report()
            
            print("✅ Completed successfully!")
            return self.results
            
        except Exception as e:
            print(f"❌ Error: {e}")
            sys.exit(1)
    
    def validate_target(self):
        """Validate the target path exists and is accessible"""
        if not self.target_path.exists():
            raise ValueError(f"Target path does not exist: {self.target_path}")
        
        if self.verbose:
            print(f"✓ Target validated: {self.target_path}")
    
    def analyze(self):
        """Perform the main analysis or operation"""
        if self.verbose:
            print("📊 Analyzing...")
            
        self.findings = []
        
        if self.target_path.is_file():
            self._analyze_file(self.target_path)
        else:
            for root, _, files in os.walk(self.target_path):
                # Skip build, cache, and dependency folders
                if any(x in root for x in ['node_modules', '.next', 'dist', 'build', 'graphify-out', '.git']):
                    continue
                for file in files:
                    if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.sql', '.dart')):
                        self._analyze_file(Path(root) / file)
                        
        self.results['status'] = 'success'
        self.results['target'] = str(self.target_path)
        self.results['findings'] = self.findings
        
        if self.verbose:
            print(f"✓ Analysis complete: {len(self.findings)} findings")
            
    def _analyze_file(self, file_path: Path):
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            lines = content.splitlines()
        except Exception as e:
            if self.verbose:
                print(f"⚠️ Could not read file {file_path}: {e}")
            return

        rel_path = file_path.relative_to(self.target_path.parent if self.target_path.is_file() else self.target_path)

        if file_path.suffix == '.dart':
            self._analyze_dart_file(file_path, lines, rel_path)
            return

        # 1. Type Safety Check (ts-nocheck or excessive 'any')
        nocheck_matches = [i for i, line in enumerate(lines) if '@ts-nocheck' in line]
        for match in nocheck_matches:
            self.findings.append({
                'file': str(rel_path),
                'line': match + 1,
                'type': 'Type Safety',
                'severity': 'Warning',
                'message': 'File uses @ts-nocheck. Ensure that full type safety is restored or proper types are declared.',
                'code': lines[match]
            })

        any_matches = [i for i, line in enumerate(lines) if re.search(r'\bany\b', line) and not line.strip().startswith('//') and not 'any' in line.lower().split('//')[0]]
        if len(any_matches) > 10:
            self.findings.append({
                'file': str(rel_path),
                'line': 1,
                'type': 'Type Safety',
                'severity': 'Info',
                'message': f"High frequency of 'any' types found ({len(any_matches)} occurrences). Refactor into proper interface unions.",
                'code': 'Multiple any matches'
            })

        # 2. Database RLS Safety Check (Supabase queries without tenant_id validation)
        supabase_queries = [i for i, line in enumerate(lines) if '.from(' in line]
        for match in supabase_queries:
            # Check if tenant_id or RLS checks are present in subsequent lines (max 5 lines below)
            context = "\n".join(lines[match:min(match+6, len(lines))])
            if 'tenant_id' not in context and 'tenantId' not in context and 'auth' not in context and 'insert' not in context and 'verifyUser' not in context:
                self.findings.append({
                    'file': str(rel_path),
                    'line': match + 1,
                    'type': 'RLS Safety',
                    'severity': 'High',
                    'message': 'Supabase table query detected without explicit tenant_id equality filter. Double check RLS compliance.',
                    'code': lines[match]
                })

        # 3. UI/UX Checker - Emojis as icons
        emoji_pattern = re.compile(r'[\u2600-\u27BF]|[\u1F300-\u1F6FF]|[\u1F900-\u1F9FF]')
        for idx, line in enumerate(lines):
            if emoji_pattern.search(line) and not line.strip().startswith('//') and not 'icon' in line.lower() and not file_path.suffix in ['.json', '.md']:
                self.findings.append({
                    'file': str(rel_path),
                    'line': idx + 1,
                    'type': 'UI/UX Guideline',
                    'severity': 'Medium',
                    'message': 'Emoji icon usage found in UI file. Recommend using Lucide SVG icons instead.',
                    'code': line.strip()
                })

            # 4. UI/UX Clickable element with cursor-pointer
            if 'onClick' in line and 'cursor-pointer' not in line and ('<div' in line or '<span' in line or '<section' in line or '<article' in line):
                self.findings.append({
                    'file': str(rel_path),
                    'line': idx + 1,
                    'type': 'UI/UX Guideline',
                    'severity': 'Medium',
                    'message': 'Interactive element (onClick) does not explicitly declare class "cursor-pointer".',
                    'code': line.strip()
                })

            # 5. UI/UX Smooth transitions
            if 'transition' in line and 'duration-' not in line and not 'transition-none' in line:
                self.findings.append({
                    'file': str(rel_path),
                    'line': idx + 1,
                    'type': 'UI/UX Guideline',
                    'severity': 'Info',
                    'message': 'Transition defined without an explicit duration (e.g. duration-200). Smoothly animate interactions.',
                    'code': line.strip()
                })

    def _analyze_dart_file(self, file_path: Path, lines: List[str], rel_path: Path):
        for idx, line in enumerate(lines):
            # 1. Print statements check
            if 'print(' in line and not line.strip().startswith('//') and not 'debugPrint' in line:
                self.findings.append({
                    'file': str(rel_path),
                    'line': idx + 1,
                    'type': 'Effective Dart Style',
                    'severity': 'Warning',
                    'message': 'Avoid raw print statements in production Flutter apps. Use debugPrint() or a standardized Logger instead.',
                    'code': line.strip()
                })
            
            # 2. Dynamic type bypass check
            if 'dynamic' in line and not line.strip().startswith('//') and not 'Map<String, dynamic>' in line:
                self.findings.append({
                    'file': str(rel_path),
                    'line': idx + 1,
                    'type': 'Type Safety',
                    'severity': 'Medium',
                    'message': 'Usage of "dynamic" type bypasses compilation safety checks. Use explicit interfaces or records instead.',
                    'code': line.strip()
                })

            # 3. Missing const constructors in UI lists / widgets
            if 'Container(' in line or 'SizedBox(' in line or 'Padding(' in line:
                context = line
                if idx > 0:
                    context = lines[idx-1] + " " + line
                if 'const' not in context and 'new' not in line:
                    self.findings.append({
                        'file': str(rel_path),
                        'line': idx + 1,
                        'type': 'Flutter Performance',
                        'severity': 'Info',
                        'message': 'Recommend declaring custom layout widgets as "const" to optimize heap allocations and rebuilds.',
                        'code': line.strip()
                    })

    def generate_report(self):
        """Generate and display the report"""
        print("\n" + "="*80)
        print("                        AUTOMATED CODE REVIEW REPORT")
        print("="*80)
        print(f"Target analyzed: {self.results.get('target')}")
        print(f"Overall status:  {self.results.get('status').upper()}")
        print(f"Total findings:  {len(self.findings)}")
        print("="*80)
        
        if not self.findings:
            print("\n✅ No architectural, safety, or styling violations found! Perfect score! 🎉\n")
            print("="*80 + "\n")
            return
            
        by_type = {}
        for f in self.findings:
            by_type[f['type']] = by_type.get(f['type'], 0) + 1
            
        print("\nSUMMARY BY CATEGORY:")
        for category, count in by_type.items():
            print(f"  - {category}: {count}")
            
        print("\nDETAILED FINDINGS:")
        for idx, f in enumerate(self.findings, 1):
            print(f"\n[{idx}] [{f['severity']}] {f['type']} in {f['file']} (Line {f['line']}):")
            print(f"    Message: {f['message']}")
            print(f"    Code:    {f['code'].strip()}")
            
        print("\n" + "="*80 + "\n")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="PR Analyzer - Automated Code Review"
    )
    parser.add_argument(
        'target',
        help='Target path to analyze or process'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose output'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output results as JSON'
    )
    parser.add_argument(
        '--output', '-o',
        help='Output file path'
    )
    
    args = parser.parse_args()
    
    tool = PrAnalyzer(
        args.target,
        verbose=args.verbose
    )
    
    results = tool.run()
    
    if args.json:
        output = json.dumps(results, indent=2)
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(output)
            print(f"Results written to {args.output}")
        else:
            print(output)

if __name__ == '__main__':
    main()
