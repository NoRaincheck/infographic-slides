#!/usr/bin/env python3
"""Knowledge base for deep research — saves findings as markdown files.

Usage:
  knowledge-base.py init                              — Create/initialize the knowledge base
  knowledge-base.py add <title> <url> <content...>    — Add a finding (writes markdown file)
  knowledge-base.py list                              — List all indexed sources
  knowledge-base.py show <title_or_url>               — Show a specific finding's markdown
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

FINDINGS_DIR = Path(__file__).resolve().parent.parent / "findings"


def init_db():
    FINDINGS_DIR.mkdir(exist_ok=True)
    print(json.dumps({"status": "initialized", "findings_dir": str(FINDINGS_DIR)}))


def slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug[:80]


def add_source(title: str, url: str, content: str):
    slug = slugify(title)
    md_path = FINDINGS_DIR / f"{slug}.md"
    md_content = f"""# {title}

**URL:** {url}
**Indexed:** {datetime.now().strftime('%Y-%m-%d %H:%M')}

---

{content}
"""
    md_path.write_text(md_content, encoding="utf-8")
    print(json.dumps({"status": "added", "title": title, "url": url, "markdown": str(md_path)}))


def list_sources():
    md_files = sorted(FINDINGS_DIR.glob("*.md"), reverse=True)
    results = []
    for md_path in md_files:
        content = md_path.read_text(encoding="utf-8")
        title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        url_match = re.search(r'\*\*URL:\*\*\s*(.+)', content)
        indexed_match = re.search(r'\*\*Indexed:\*\*\s*(.+)', content)
        results.append({
            "title": title_match.group(1).strip() if title_match else md_path.stem,
            "url": url_match.group(1).strip() if url_match else "",
            "indexed_at": indexed_match.group(1).strip() if indexed_match else "",
            "file": str(md_path),
        })
    print(json.dumps(results, ensure_ascii=False, indent=2))


def show_source(query: str):
    query_lower = query.lower()

    # Try matching by filename first
    for md_path in FINDINGS_DIR.glob("*.md"):
        if query_lower in md_path.stem.lower():
            print(md_path.read_text(encoding="utf-8"))
            return

    # Try matching by parsing title/url from each file
    for md_path in sorted(FINDINGS_DIR.glob("*.md"), reverse=True):
        content = md_path.read_text(encoding="utf-8")
        title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        url_match = re.search(r'\*\*URL:\*\*\s*(.+)', content)
        title = title_match.group(1).strip() if title_match else ""
        url = url_match.group(1).strip() if url_match else ""
        if query_lower in title.lower() or query_lower in url.lower():
            print(content)
            return

    print(json.dumps({"error": f"No source found matching '{query}'"}))


def main():
    if len(sys.argv) < 2:
        print("Usage: knowledge-base.py {init|add|list|show} [args...]", file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1]

    if command == "init":
        init_db()
    elif command == "add":
        if len(sys.argv) < 5:
            print("Usage: knowledge-base.py add <title> <url> <content...>", file=sys.stderr)
            sys.exit(1)
        title = sys.argv[2]
        url = sys.argv[3]
        content = " ".join(sys.argv[4:])
        add_source(title, url, content)
    elif command == "list":
        list_sources()
    elif command == "show":
        if len(sys.argv) < 3:
            print("Usage: knowledge-base.py show <title_or_url>", file=sys.stderr)
            sys.exit(1)
        show_source(" ".join(sys.argv[2:]))
    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
