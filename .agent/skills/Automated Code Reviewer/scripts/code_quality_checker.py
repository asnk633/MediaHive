#!/usr/bin/env python3
"""
Code Quality & Performance Checker
Automated tool for code reviewer tasks that performs deep static analysis to identify
performance bottlenecks, database query inefficiencies (SQL optimization), and anti-patterns.
"""

import os
import sys
import json
import argparse
import re
from pathlib import Path
from typing import Dict, List, Optional

class CodeQualityChecker:
    """Main class for code quality and performance checker functionality"""
    
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
            print("📊 Checking code quality & query paths...")
            
        self.findings = []
        
        if self.target_path.is_file():
            self._analyze_file(self.target_path)
        else:
            for root, _, files in os.walk(self.target_path):
                # Skip build, cache, and dependency folders
                if any(x in root for x in ['node_modules', '.next', 'dist', 'build', 'graphify-out', '.git']):
                    continue
                for file in files:
                    if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.sql')):
                        self._analyze_file(Path(root) / file)
                        
        self.results['status'] = 'success'
        self.results['target'] = str(self.target_path)
        self.results['findings'] = self.findings
        
        if self.verbose:
            print(f"✓ Check complete: {len(self.findings)} findings")
            
    def _analyze_file(self, file_path: Path):
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            lines = content.splitlines()
        except Exception as e:
            if self.verbose:
                print(f"⚠️ Could not read file {file_path}: {e}")
            return

        rel_path = file_path.relative_to(self.target_path.parent if self.target_path.is_file() else self.target_path)

        # 1. SQL N+1 Query Loop Check (Queries in loops / map / forEach)
        for idx, line in enumerate(lines):
            # Check for map/forEach followed by await/supabase calls
            if ('map(' in line or 'forEach(' in line) and ('async' in line or '=>' in line):
                # Look at next 10 lines for DB calls
                context_range = lines[idx:min(idx+12, len(lines))]
                context_str = "\n".join(context_range)
                if 'supabase' in context_str or '.from(' in context_str or 'db.' in context_str:
                    self.findings.append({
                        'file': str(rel_path),
                        'line': idx + 1,
                        'type': 'SQL Optimization',
                        'severity': 'High',
                        'message': 'Potential N+1 query loop. DB queries inside a loop/map/forEach statement should be batched (e.g., using IN, ANY or Promise.all / join queries) for O(1) performance.',
                        'code': line.strip()
                    })

        # 2. Inefficient Pagination (Offset vs Keyset)
        for idx, line in enumerate(lines):
            if 'offset' in line.lower() and ('limit' in line.lower() or 'range(' in line.lower()) and not 'keyset' in line.lower():
                self.findings.append({
                    'file': str(rel_path),
                    'line': idx + 1,
                    'type': 'SQL Optimization',
                    'severity': 'Medium',
                    'message': 'Traditional OFFSET pagination detected. Consider key-based pagination (e.g. ID > last_id) for high performance with larger datasets.',
                    'code': line.strip()
                })

        # 3. Touch target sizes for mobile viewports (UX checking)
        for idx, line in enumerate(lines):
            if ('h-4 ' in line or 'h-5 ' in line or 'h-6 ' in line or 'w-4 ' in line or 'w-5 ' in line or 'w-6 ' in line) and 'onClick' in line and not 'p-' in line and not 'padding' in line:
                self.findings.append({
                    'file': str(rel_path),
                    'line': idx + 1,
                    'type': 'UI/UX Performance',
                    'severity': 'Medium',
                    'message': 'Interactive element has small size dimensions without enough padding. Ensure touch targets are at least 44x44px (e.g. add padding p-2 or use h-10 w-10).',
                    'code': line.strip()
                })

        # 4. Inefficient re-renders & React memoization (useMemo/useCallback)
        for idx, line in enumerate(lines):
            if 'function' in line and 'Props' in line and not 'React.memo' in content and 'export default' in line:
                self.findings.append({
                    'file': str(rel_path),
                    'line': idx + 1,
                    'type': 'React Performance',
                    'severity': 'Info',
                    'message': 'React component exported without React.memo. Consider memoization for dashboard widgets to prevent unnecessary layout recalculations.',
                    'code': line.strip()
                })

        # 5. Composite Index checks for multi-tenant filters
        supabase_where = [i for i, line in enumerate(lines) if '.eq(' in line]
        for match in supabase_where:
            context = "\n".join(lines[max(0, match-2):min(match+5, len(lines))])
            if 'is_demo_data' in context and 'tenant_id' in context:
                # Ensure query optimizes filters using composite index
                self.findings.append({
                    'file': str(rel_path),
                    'line': match + 1,
                    'type': 'SQL Optimization',
                    'severity': 'Medium',
                    'message': 'Multi-tenant filters detected on "is_demo_data" and "tenant_id". Ensure a composite index exists on (tenant_id, is_demo_data) to maintain O(1) query time.',
                    'code': lines[match]
                })

    def generate_report(self):
        """Generate and display the report"""
        print("\n" + "="*80)
        print("                   PERFORMANCE & QUALITY CHECK REPORT")
        print("="*80)
        print(f"Target analyzed: {self.results.get('target')}")
        print(f"Overall status:  {self.results.get('status').upper()}")
        print(f"Total findings:  {len(self.findings)}")
        print("="*80)
        
        if not self.findings:
            print("\n✅ Performance and queries optimized flawlessly! Keep up the great standard! 🚀\n")
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
        description="Code Quality & Performance Checker"
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
    
    tool = CodeQualityChecker(
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
