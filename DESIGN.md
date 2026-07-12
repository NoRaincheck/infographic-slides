# DESIGN.md

Architecture and data flow for infographic-slides.

## System overview

```
┌─────────────────────────────────────────────────────────┐
│  CLI (src/index.ts)                                     │
│  Parses args → orchestrates stages → writes output       │
└──────────┬──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│                     Pipeline Stages                       │
│                                                           │
│  1. Mindmap ──→ 2. Story ──→ 3. Slide Design             │
│                                     │                     │
│                                     ▼                     │
│  5. Render ←── 4. Illustrations                          │
│       │                                                  │
│       ▼                                                  │
│  6. Export                                               │
└──────────────────────────────────────────────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐  ┌──────────┐
│  LLM   │  │  Flux 2   │
│(local) │  │  (CLI)    │
└────────┘  └──────────┘
```

## Data flow

### Stage 1: Mindmap

```
Input: raw topic text
  → LLM call with MINDMAP_SYSTEM prompt
  → MindmapArtifact { input, tree: { label, children } }
  → output/artifacts/01-mindmap.json
```

Breaks the topic into a 2-3 level concept hierarchy (5-15 leaf nodes).

### Stage 2: Story

```
Input: MindmapArtifact
  → LLM call with STORY_SYSTEM prompt
  → StoryArtifact { storyTitle, targetSlides, slides[] }
  → output/artifacts/02-story.json
```

Plans a coherent narrative arc with slide titles, descriptions, and key points.

### Stage 3: Slide Design

```
Input: StoryArtifact
  → LLM call with infographic-syntax-creator skill context
  → SlideDesignArtifact[] { slideIndex, title, template, syntax }
  → output/artifacts/03-slides.json
```

For each slide, selects an AntV Infographic template and generates valid DSL. The vendored skill's template list and
syntax rules are injected into the system prompt.

### Stage 4: Illustrations

```
Input: SlideDesignArtifact[]
  → LLM call with ILLUSTRATION_SYSTEM prompt
  → IllustrationDecision[] { slideIndex, prompt | null }
  → output/artifacts/04-illustrations.json
```

Decides which slides benefit from custom illustrations (typically 2-4 per deck).

### Stage 5: Render

```
Input: SlideDesignArtifact[] + IllustrationDecision[]
  → For slides with illustrations:
      Flux 2 CLI → PNG → base64 → embedded in DSL syntax
  → AntV SSR renderToString() → SVG string
  → Puppeteer → high-DPI PNG
  → output/slides/slide-{n}.png + .svg
  → output/artifacts/05-rendered.json
```

### Stage 6: Export

```
Input: rendered PNGs
  → (Future) LLM-driven per-slide refinements
  → Flux 2 edit mode for style transfer
  → Final output PNGs
```

Currently a placeholder. See FUTURE.md for planned features.

## Artifact format

Each stage writes a JSON artifact. These are the source of truth between runs.

```
output/artifacts/
├── 01-mindmap.json
├── 02-story.json
├── 03-slides.json
├── 04-illustrations.json
└── 05-rendered.json
```

Artifacts are:

- **Reviewable** — human-readable JSON, can be hand-edited
- **Cacheable** — stages check for existing artifacts before calling LLM
- **Regeneratable** — `--regenerate <stage>` forces re-execution
- **Skip-safe** — `--skip <stage>` produces sensible fallbacks

## Illustration embedding

The AntV Infographic DSL supports base64 data URIs for illustrations:

```infographic
infographic list-row-horizontal-icon-arrow
data
  title Quantum Computing
  illus data:image/png;base64,iVBORw0KGgo...
  lists
    - label Qubits
      icon atom
```

The `Illus` component in the rendered SVG reads this and displays the image in the designated region. No custom resource
loader is needed.

## LLM integration

All LLM calls use OpenAI-compatible chat completions:

```
POST {llmUrl}/v1/chat/completions
{
  "model": "{model}",
  "messages": [
    { "role": "system", "content": "{system prompt + skill context}" },
    { "role": "user", "content": "{user message}" }
  ]
}
```

### Skill injection

Skills from `skills/` are loaded at runtime and injected into system prompts. Only the slide design stage injects the
full infographic-syntax-creator skill (DSL rules + template list). Other stages use domain-specific prompts.

### JSON parsing

LLM responses are expected to contain JSON. `chatJson<T>()` handles this with a multi-stage extraction pipeline:

1. **Code fence extraction** — matches `` ```json ... ``` `` blocks
2. **Direct parse** — tries `JSON.parse` on the trimmed response
3. **Brace balancing** — finds the first `{...}` or `[...]` by tracking depth, strings, and escapes
4. **Trailing comma stripping** — removes `,}` and `,]` patterns, then retries all of the above

The first candidate that parses successfully is returned.

#### Retries and validation

`chatJson` accepts an optional `ChatJsonOptions`:

```typescript
interface ChatJsonOptions {
  retries?: number; // default: 2 (3 total attempts)
  validate?: (value: unknown) => void; // throw to trigger retry
}
```

Each pipeline stage passes a `validate` function that checks the parsed structure matches the expected artifact shape.
If validation fails (or JSON parsing fails), the LLM is called again with the same prompt. After all retries are
exhausted, the last error is thrown.

**Plan vs actual**: The original design called `JSON.parse` once and trusted the result. In practice, local LLMs
frequently wrap JSON in prose, use trailing commas, or return slightly wrong structures. The extraction pipeline and
retry loop handle these cases without requiring prompt engineering workarounds.

#### Schema normalization

Cached artifacts may have been written by earlier versions of the code with different schemas. Each stage normalizes
cached data before use:

- **Mindmap**: `normalizeMindmap` accepts both `{ label, children }` (old) and `{ tree: { label, children } }`
  (current). Falls back to a minimal tree if neither matches.
- **Other stages**: Currently trust the cached schema. If schema versioning is added (see FUTURE.md), normalization will
  be needed here too.

## Rendering pipeline

1. Generate HTML with AntV Infographic CDN script
2. Puppeteer loads HTML in headless Chrome
3. Waits for SVG rendering + font loading
4. Extracts SVG element for `.svg` export
5. Screenshots viewport for `.png` export at configurable DPI

## Extension points

- **New stage**: Add to `src/pipeline/`, wire in `src/index.ts` stages array
- **New prompt**: Add to `src/prompts/`, import in the relevant pipeline module
- **New template**: The LLM selects from AntV's 65+ built-in templates automatically
- **Custom illustrations**: Modify illustration prompts or add a post-illustration stage
