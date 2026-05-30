"""
find_case_duplicates.py
Scans the MediaHive web (src/) and mobile (mediahive_mobile/lib/) codebases
for string literals and identifiers that appear in multiple case-variant forms
(e.g. 'urgent' vs 'Urgent' vs 'URGENT').

Outputs a JSON report: .tmp/case_duplicates_report.json
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

# ── Config ────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent  # d:/MediaHive App

WEB_ROOTS = [ROOT / "src"]
MOBILE_ROOTS = [ROOT / "mediahive_mobile" / "lib"]

WEB_EXTS = {".ts", ".tsx", ".js", ".jsx"}
MOBILE_EXTS = {".dart"}

EXCLUDE_DIRS = {
    "node_modules", ".next", "build", ".dart_tool", "outputs",
    ".git", "__pycache__", ".tmp", "graphify-out", "archive",
    "__tests_archive__", "tests.archived"
}

# Minimum length – skip single-char or 2-char words to reduce noise
MIN_WORD_LEN = 3

# These normalized words are very common across the stack and will appear
# in both cases by design (e.g. HTML attribute names, CSS classes).
# Add any known-intentional pairs here to skip them.
INTENTIONAL_EXCEPTIONS = {
    "true", "false", "null", "undefined", "string", "number", "object",
    "boolean", "any", "void", "never", "type", "class", "function", "return",
    "import", "export", "from", "const", "let", "var", "if", "else",
    "for", "while", "do", "switch", "case", "break", "continue", "new",
    "this", "super", "extends", "implements", "interface", "enum",
    # common UI words that appear naturally in both cases
    "id", "key", "ref", "map", "set", "get", "has", "add", "delete",
    "push", "pop", "shift", "join", "split", "trim", "length",
    "width", "height", "top", "left", "right", "bottom", "center",
    "flex", "grid", "block", "inline", "none", "auto", "full",
    # dart keywords
    "final", "static", "abstract", "async", "await", "yield", "with",
    "on", "in", "is", "as", "show", "hide", "library", "part",
    # very common words that genuinely appear in both lower and title case
    "name", "title", "label", "value", "data", "text", "info", "date",
    "time", "user", "role", "icon", "size", "list", "item", "page",
    "view", "card", "form", "modal", "table", "row", "col", "box",
    "tag", "note", "file", "path", "url", "link", "body", "head",
    "meta", "nav", "tab", "menu", "bar", "dot", "chip", "badge",
}

# ── Extraction ────────────────────────────────────────────────────────────────
STRING_LIT_RE = re.compile(r"""(?:"|'|`)([\w\s_\-]+?)(?:"|'|`)""")
# Also capture enum-like identifiers and comparisons e.g. === 'Urgent'
COMPARISON_RE = re.compile(r"""(?:===|!==|==|!=)\s*['"`]([\w\-]+)['"`]""")
# Dart string literals  
DART_STR_RE = re.compile(r"""(?:'|")([\w\s_\-]+?)(?:'|")""")
# Switch/case literals
CASE_LIT_RE = re.compile(r"""case\s+['"`]?([\w\-]+)['"`]?:""")

WORD_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_\-]*$")


def iter_source_files(roots, extensions):
    for root in roots:
        for dirpath, dirnames, filenames in os.walk(root):
            # Prune excluded dirs in-place
            dirnames[:] = [
                d for d in dirnames
                if d not in EXCLUDE_DIRS and not d.startswith(".")
            ]
            for fname in filenames:
                if Path(fname).suffix in extensions:
                    yield Path(dirpath) / fname


def extract_strings_from_file(filepath: Path) -> list[str]:
    """Extract all string literals from a source file."""
    try:
        src = filepath.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return []

    hits = set()
    for pattern in [STRING_LIT_RE, COMPARISON_RE, CASE_LIT_RE, DART_STR_RE]:
        for m in pattern.finditer(src):
            token = m.group(1).strip()
            # Split multi-word strings into individual words too
            for word in token.split():
                word = word.strip("-_")
                if WORD_RE.match(word) and len(word) >= MIN_WORD_LEN:
                    hits.add(word)
            # Also keep the full token if it looks like a single slug
            token_clean = token.strip()
            if WORD_RE.match(token_clean) and len(token_clean) >= MIN_WORD_LEN:
                hits.add(token_clean)
    return list(hits)


# ── Analysis ──────────────────────────────────────────────────────────────────
def find_case_variants(word_occurrences: dict[str, list[str]]) -> list[dict]:
    """
    Group words by their lowercase form and report groups with >1 distinct
    case variant.

    word_occurrences: { word_as_found: [relative_file_path, ...] }
    Returns list of { normalized, variants: { variant: [files] } }
    """
    by_lower: dict[str, dict[str, list[str]]] = defaultdict(lambda: defaultdict(list))

    for word, files in word_occurrences.items():
        normed = word.lower()
        if normed in INTENTIONAL_EXCEPTIONS:
            continue
        by_lower[normed][word].extend(files)

    results = []
    for normed, variants in sorted(by_lower.items()):
        if len(variants) <= 1:
            continue
        # Deduplicate file lists
        deduped = {v: sorted(set(fs)) for v, fs in variants.items()}
        results.append({
            "normalized": normed,
            "variants": deduped,
            "variant_count": len(deduped),
        })

    # Sort by most variants first, then alphabetically
    results.sort(key=lambda x: (-x["variant_count"], x["normalized"]))
    return results


def get_relative_path(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT)).replace("\\", "/")
    except ValueError:
        return str(path)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("Scanning web codebase (src/)…")
    word_occurrences: dict[str, list[str]] = defaultdict(list)

    web_files = list(iter_source_files(WEB_ROOTS, WEB_EXTS))
    print(f"  {len(web_files)} web source files")
    for fpath in web_files:
        rel = get_relative_path(fpath)
        for word in extract_strings_from_file(fpath):
            word_occurrences[word].append(rel)

    print("Scanning mobile codebase (mediahive_mobile/lib/)…")
    mob_files = list(iter_source_files(MOBILE_ROOTS, MOBILE_EXTS))
    print(f"  {len(mob_files)} dart source files")
    for fpath in mob_files:
        rel = get_relative_path(fpath)
        for word in extract_strings_from_file(fpath):
            word_occurrences[word].append(rel)

    print(f"\nTotal unique word-forms found: {len(word_occurrences)}")

    duplicates = find_case_variants(word_occurrences)
    print(f"Case-variant duplicate groups found: {len(duplicates)}")

    # ── Write report ──────────────────────────────────────────────────────────
    out_dir = ROOT / ".tmp"
    out_dir.mkdir(exist_ok=True)
    report_path = out_dir / "case_duplicates_report.json"
    report = {
        "summary": {
            "web_files_scanned": len(web_files),
            "mobile_files_scanned": len(mob_files),
            "total_unique_word_forms": len(word_occurrences),
            "duplicate_groups": len(duplicates),
        },
        "duplicates": duplicates,
    }
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nFull report written to: {report_path}")

    # ── Console preview ───────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("TOP CASE-VARIANT DUPLICATES (showing first 40 groups)")
    print("=" * 70)
    for entry in duplicates[:40]:
        norm = entry["normalized"]
        variants = entry["variants"]
        print(f"\n  [{norm}]  ({entry['variant_count']} variants)")
        for var, files in sorted(variants.items()):
            files_preview = files[:3]
            more = len(files) - 3
            suffix = f"  (+{more} more)" if more > 0 else ""
            print(f"    '{var}':  {', '.join(files_preview)}{suffix}")

    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()
