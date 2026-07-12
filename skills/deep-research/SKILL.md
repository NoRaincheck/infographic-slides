---
name: deep-research
description: Conduct deep iterative research on any topic using DuckDuckGo search, Wikipedia fact-checking, and a local markdown knowledge base. Use when the user asks to research a topic, investigate a question, compare options, or needs well-sourced, multi-source answers.
---

# Deep Research

Iterative research skill inspired by NotebookLM and Grok Deep Research. Searches multiple sources, cross-references
findings, expands queries conceptually, and builds a local knowledge base for retrieval.

## Tools

All scripts are in `scripts/` relative to this skill directory. Use `.venv/bin/python3` for Python scripts.

| Script                                                  | Purpose                                                   |
| ------------------------------------------------------- | --------------------------------------------------------- |
| `scripts/search.sh <query>`                             | DuckDuckGo search, returns JSON with title, url, abstract |
| `scripts/wiki_lookup.py <term>`                         | Wikipedia lookup, returns summary and sections            |
| `scripts/knowledge-base.py init`                        | Create/initialize the knowledge base                      |
| `scripts/knowledge-base.py add <title> <url> <content>` | Add a finding (writes markdown file in `findings/`)       |
| `scripts/knowledge-base.py list`                        | List all indexed sources with metadata                    |
| `scripts/knowledge-base.py show <query>`                | Show a specific finding's markdown content                |

## Workflow

### Phase 1: Discovery

1. Start with the user's query. Run `scripts/search.sh` with the exact query.
2. For each promising result, run `scripts/search.sh` again with **conceptually related terms** (synonyms, related
   concepts, alternative phrasings). This is how you confirm and expand coverage — similar to how NotebookLM finds
   tangential sources.
3. For any specific entity, person, or concept mentioned, run `scripts/wiki_lookup.py` for authoritative background.

### Phase 2: Deep Dive

4. Pick the 3-5 most relevant sources from discovery. For each URL, use `webfetch` to read the full page content.
5. Search again with more specific queries derived from what you've found (e.g., if you find a specific study, search
   for that study by name).
6. Look for **contradictory evidence** — search for the opposite or skeptical viewpoint.

### Phase 3: Fact-Checking

7. For key claims, run `scripts/wiki_lookup.py` to verify against authoritative sources.
8. Cross-check dates, numbers, and specific assertions across at least 2 independent sources.
9. Note any discrepancies or areas where sources disagree.

### Phase 4: Synthesis

10. Use `scripts/knowledge-base.py add` to save all findings as markdown files in `findings/`.
11. Use `scripts/knowledge-base.py list` to see all indexed sources, and `scripts/knowledge-base.py show <title>` to
    retrieve specific findings.
12. Compile a structured report with:
    - Executive summary
    - Key findings with source citations
    - Areas of consensus and disagreement
    - Confidence assessment per claim (high/medium/low)
    - Gaps where more research would help

## Search Strategy

### Query Expansion

Never rely on a single query. For each research topic:

1. **Direct search** — the user's exact query
2. **Synonym search** — replace key terms with synonyms (e.g., "AI agents" → "autonomous agents")
3. **Related concept search** — adjacent topics (e.g., "LLM evaluation" → "model benchmarking", "AI safety")
4. **Specific entity search** — if you find names of people, papers, tools, search those directly
5. **Contradiction search** — search for opposing views (e.g., "LLM limitations criticism")

### Source Diversity

Aim for:

- At least 3-5 different domains (news, academic, blogs, official docs)
- Recent sources (within last 2 years for fast-moving topics)
- At least one authoritative reference (Wikipedia, government, academic)
- At least one source with a different viewpoint

## Knowledge Base

Findings are stored as markdown files in `findings/`.

**Workflow:**

1. Run `scripts/knowledge-base.py init` once (creates `findings/` directory)
2. After fetching any page content, run:
   ```bash
   scripts/knowledge-base.py add "Page Title" "https://example.com" "Full page content here"
   ```
3. List all sources: `scripts/knowledge-base.py list`
4. Retrieve a specific finding: `scripts/knowledge-base.py show "keyword from title or url"`

Each finding is saved as a markdown file (e.g., `findings/page-title.md`) containing:

- Title and URL as metadata
- Indexed timestamp
- Full page content

## Output Format

When the user asks for research results, structure the output as:

```
## Research: <topic>

### Summary
<2-3 sentence overview of findings>

### Key Findings
1. **Claim** — <evidence from sources> [Source 1, Source 2]
2. **Claim** — <evidence from sources> [Source 3]

### Areas of Consensus
- <agreement points>

### Areas of Disagreement
- <conflicting claims and what each side says>

### Confidence Assessment
- **High confidence**: <claims with strong multi-source support>
- **Medium confidence**: <claims with partial support>
- **Low confidence / unclear**: <claims with little or conflicting evidence>

### Sources
1. Title — URL
2. ...

### Gaps
- <areas where evidence is thin or missing>
```

## References

See [references/workflow.md](references/workflow.md) for detailed examples and edge cases.
