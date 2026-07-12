# AGENTS.md

Instructions for AI agents working on this codebase.

## Project overview

TypeScript CLI tool that generates infographic slide decks. 6-stage pipeline:
mindmap → story → slide design → illustrations → render → export.

All content generation goes through a local LLM (OpenAI-compatible chat completions).
Rendering uses @antv/infographic SSR + Puppeteer. Image generation uses Flux 2 via CLI.

## Build & run

```sh
npm run build        # TypeScript compile to dist/
npm run test         # Run tests (node:test + tsx)
npm run dev          # Build + run
node dist/index.js   # CLI entry point
```

Verify changes with `npx tsc --noEmit` and `npm test`.

## Key files

| File | Purpose |
|---|---|
| `src/index.ts` | CLI entry point, orchestrates pipeline |
| `src/llm.ts` | LLM client (`chat`, `chatJson`) + skill file loader |
| `src/prompts/*.ts` | System/user prompts for each LLM call |
| `src/pipeline/*.ts` | One file per pipeline stage |
| `src/utils/types.ts` | Shared interfaces + artifact path helpers |
| `src/utils/render.ts` | AntV SSR → SVG → Puppeteer → PNG |
| `src/utils/image-gen.ts` | Flux 2 CLI wrapper (generate + edit) |
| `skills/` | Vendored AntV Infographic skills (prompt context for LLM) |
| `test/*.test.ts` | Unit tests (node:test + tsx) |

## Conventions

- **ESM only** — `"type": "module"` in package.json, all imports use `.js` extensions
- **No comments** in source code unless explaining non-obvious behavior
- **Artifact pattern**: each stage reads from disk cache → LLM call → writes artifact JSON
  - Cache check: `!opts.regenerate.includes(stage) && !opts.skip.includes(stage) && existsSync(path)`
  - Skip fallback: produce minimal sensible output without LLM
- **Prompts**: system prompts are constants in `src/prompts/*.ts`, user prompts are functions
- **LLM output**: always JSON. Parse with `chatJson<T>()` which handles ```json fences

## LLM integration

- Endpoint: configurable, default `http://localhost:1234/v1/chat/completions`
- Model: configurable, default `qwen3.6-35b-a3b-mtp`
- Skills are loaded from `skills/` directory and injected into system prompts
- All LLM calls go through `src/llm.ts` — never call fetch directly

## Rendering

- `@antv/infographic/ssr` provides `renderToString` for Node.js (no browser needed)
- Puppeteer renders the SVG to high-DPI PNG
- Illustrations are embedded as base64 data URIs in the DSL syntax

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
- The ` Illus` component accepts base64 data URIs for embedded images
- Flux 2 CLI paths are hardcoded in `src/utils/image-gen.ts` — update for your system
- Puppeteer `headless: true` (not `"new"`) for TypeScript compatibility
