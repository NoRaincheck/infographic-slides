#!/bin/bash
# DuckDuckGo search wrapper using ddgr
# Usage: search.sh <query> [max_results]
# Output: JSON array of {title, href, body}

QUERY="$1"
MAX_RESULTS="${2:-5}"

if [ -z "$QUERY" ]; then
  echo "Usage: search.sh <query> [max_results]"
  exit 1
fi

ddgr --json -n "$MAX_RESULTS" "$QUERY" 2>/dev/null | python3 -c "
import sys, json

raw = sys.stdin.read().strip()
if not raw:
    print('[]')
    sys.exit(0)

try:
    results = json.loads(raw)
except json.JSONDecodeError:
    print('[]')
    sys.exit(0)

# Normalize: ddgr --json returns {title, abstract, url}
output = []
for r in results[:$MAX_RESULTS]:
    output.append({
        'title': r.get('title', ''),
        'href': r.get('url', ''),
        'body': r.get('abstract', '')
    })

print(json.dumps(output, ensure_ascii=False, indent=2))
"
