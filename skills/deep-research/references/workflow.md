# Deep Research Workflow Reference

## Query Expansion Techniques

When the user gives a research query, expand it systematically:

### 1. Direct Queries

Use the user's exact words first.

```bash
scripts/search.sh "transformer architecture advantages"
```

### 2. Synonym Queries

Replace key terms with synonyms or related terminology.

```bash
scripts/search.sh "neural network architecture benefits"
scripts/search.sh "attention mechanism strengths"
```

### 3. Adjacent Concept Queries

Search for topics that are closely related but not identical.

```bash
scripts/search.sh "transformer vs RNN comparison"
scripts/search.sh "language model architecture history"
```

### 4. Specific Entity Queries

When you discover specific names, papers, or tools, search those directly.

```bash
scripts/search.sh "Attention Is All You Need paper"
scripts/search.sh "BERT GPT transformer benchmark"
```

### 5. Contradiction Queries

Search for criticism, limitations, or opposing views.

```bash
scripts/search.sh "transformer limitations problems"
scripts/search.sh "attention mechanism criticisms"
```

### 6. Temporal Queries

For time-sensitive topics, add year references.

```bash
scripts/search.sh "LLM benchmarks 2025 2026"
scripts/search.sh "AI regulation latest developments"
```

## Fact-Checking Strategy

### Wikipedia as Ground Truth

- Use Wikipedia for established facts (dates, definitions, entity relationships)
- Cross-reference specific claims against Wikipedia
- Note when Wikipedia has no relevant article (might indicate a niche or new topic)

### Cross-Sourcing

For any important claim, verify against at least 2 independent sources:

1. One from a different domain (e.g., academic paper vs. news article)
2. One that doesn't cite the other (avoid circular reporting)

### Confidence Levels

| Level      | Criteria                                                                            |
| ---------- | ----------------------------------------------------------------------------------- |
| **High**   | Confirmed by 3+ independent sources, including at least one authoritative reference |
| **Medium** | Confirmed by 2 sources, or 1 authoritative source plus corroboration                |
| **Low**    | Only 1 source, or sources conflict, or the claim is speculative                     |

## Knowledge Base Query Patterns

After building the knowledge base, use these commands to connect findings:

```bash
# List all indexed sources
scripts/knowledge-base.py list

# Retrieve a specific finding
scripts/knowledge-base.py show "keyword from title or url"
```

## Handling Edge Cases

### No Results Found

- Broaden the query (remove specific terms)
- Try a different search engine perspective
- Check if the topic might be under a different name
- Fall back to Wikipedia for the concept

### Conflicting Information

- Note the conflict explicitly in the report
- Assess which source is more authoritative
- If unresolved, mark as "disputed" with low confidence

### Paywalled Content

- Use `webfetch` to try accessing the full page
- If inaccessible, note the source in citations but don't include content
- Look for open-access alternatives or summaries

### Very Recent Topics

- Prioritize recency in search results
- Note when sources are preprints or unpublished
- Acknowledge that information may change rapidly
