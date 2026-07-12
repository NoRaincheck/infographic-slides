# AGENTS.md

Instructions for AI agents working on this codebase.

## Project overview

TypeScript CLI tool that generates infographic slide decks. 6-stage pipeline: mindmap → story → slide design →
illustrations → render → export.

All content generation goes through a local LLM (OpenAI-compatible chat completions). Rendering uses @antv/infographic
SSR + Puppeteer. Image generation uses Flux 2 via CLI.

## Build & run

```sh
npm run build        # TypeScript compile to dist/
npm run test         # Run tests (node:test + tsx)
npm run dev          # Build + run
node dist/index.js   # CLI entry point
```

Verify changes with `npx tsc --noEmit` and `npm test`.

## Key files

| File                     | Purpose                                                   |
| ------------------------ | --------------------------------------------------------- |
| `src/index.ts`           | CLI entry point, orchestrates pipeline                    |
| `src/llm.ts`             | LLM client (`chat`, `chatJson`, `chatVision`) + skill loader |
| `src/prompts/*.ts`       | System/user prompts for each LLM call                     |
| `src/pipeline/*.ts`      | One file per pipeline stage                               |
| `src/utils/types.ts`     | Shared interfaces + artifact path helpers                 |
| `src/utils/render.ts`    | AntV SSR → SVG → Puppeteer → PNG                          |
| `src/utils/image-gen.ts` | Flux 2 CLI wrapper (generate + edit)                      |
| `src/utils/bg-removal.ts`| BiRefNet background removal via `uv run`                  |
| `src/utils/composite.ts` | Transparent illustration overlay via Puppeteer canvas      |
| `skills/`                | Vendored AntV Infographic skills (prompt context for LLM) |
| `test/*.test.ts`         | Unit tests (node:test + tsx)                              |

## Conventions

- **ESM only** — `"type": "module"` in package.json, all imports use `.js` extensions
- **No comments** in source code unless explaining non-obvious behavior
- **Artifact pattern**: each stage reads from disk cache → LLM call → writes artifact JSON
  - Cache check: `!opts.regenerate.includes(stage) && !opts.skip.includes(stage) && existsSync(path)`
  - Skip fallback: produce minimal sensible output without LLM
- **Prompts**: system prompts are constants in `src/prompts/*.ts`, user prompts are functions
- **LLM output**: always JSON. Parse with `chatJson<T>()` which handles extraction and retries

## LLM integration

- Endpoint: configurable, default `http://localhost:1234/v1/chat/completions`
- Model: configurable, default `qwen3.6-35b-a3b-mtp`
- Skills are loaded from `skills/` directory and injected into system prompts
- All LLM calls go through `src/llm.ts` — never call fetch directly

### LLM resilience patterns

Local LLMs are unreliable. The codebase handles this at two levels:

**`chatJson` level** (`src/llm.ts`):

- Flexible JSON extraction: code fences → direct parse → brace balancing → trailing comma stripping
- Retries on parse or validation failure (default 2 retries, 3 total attempts)
- Accepts optional `validate` callback — throw to trigger retry
- Logs retry attempts to stderr

**Pipeline stage level** (`src/pipeline/*.ts`):

- Each stage passes a `validate` function to `chatJson` that checks the parsed structure
- Cached artifacts are normalized on read (e.g. `normalizeMindmap` handles old vs new schema)
- Mindmap stage falls back to a minimal tree if all LLM attempts fail
- Other stages throw on failure (caught by the pipeline orchestrator)

When adding a new pipeline stage:

1. Define the expected artifact shape in `src/utils/types.ts`
2. Write a `validate` function that checks for required fields and types
3. Pass it to `chatJson` as the `validate` option
4. Handle the case where the LLM returns a slightly different structure (e.g. missing optional wrappers)

## Rendering

- `@antv/infographic/ssr` provides `renderToString` for Node.js (no browser needed)
- Puppeteer renders the SVG to high-DPI PNG
- Illustrations are generated with solid backgrounds, backgrounds are removed via BiRefNet, then composited onto rendered slides using Puppeteer canvas

## Illustration pipeline

Illustrations are optional (`--illustrations on|off|auto`). When enabled, the render stage:
1. Generates illustration with solid-color background (for clean removal)
2. Removes background via BiRefNet (`uv run models/birefnet_removal.py`)
3. Renders slide AntV syntax to PNG (no `Illus` component in syntax)
4. Composites transparent illustration onto slide PNG via Puppeteer canvas
5. Optionally verifies composited result via LLM vision

Background removal uses Python (via `uv run`) with ONNX runtime. Python dependencies are in `pyproject.toml`.
The LLM client supports multimodal messages (`chatVision`, `chatJsonVision`) for vision verification.

## Adding a new pipeline stage

1. Create `src/pipeline/{stage}.ts` with `run{Stage}(opts, ...deps)`
2. Add artifact type to `src/utils/types.ts`
3. Add prompt to `src/prompts/`
4. Wire into the `stages` array in `src/index.ts`
5. Add stage name to `STAGE_NAMES` in types.ts

## Dependencies

- `@antv/infographic` — not in package.json (used via CDN in browser, SSR via `@antv/infographic/ssr`)
- `puppeteer` — headless Chrome for PNG export
- `commander` — CLI argument parsing
- `chalk` — terminal colors
- `ora` — spinners (not yet wired up)

## Common pitfalls

- AntV Infographic syntax is whitespace-sensitive: 2-space indentation, space-separated key-value pairs
- The `Illus` component accepts base64 data URIs for embedded images
- Flux 2 CLI paths are hardcoded in `src/utils/image-gen.ts` — update for your system
- Puppeteer `headless: true` (not `"new"`) for TypeScript compatibility
