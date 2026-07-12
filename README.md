# Infographic Slides

A CLI tool that generates infographic slide decks from text using purely local LLMs and image generation. A modern re-implementation of [lida](https://github.com/microsoft/lida) using [AntV Infographic](https://infographic.antv.vision/) for rendering.

## How it works

1. **Mindmap**: Break content into a hierarchical concept tree
2. **Story**: Plan a coherent narrative with a target number of slides
3. **Slide Design**: Choose the best AntV Infographic template for each slide and generate valid DSL syntax
4. **Illustrations**: Decide which slides need custom illustrations, generate them with Flux 2
5. **Render**: Embed illustrations into the syntax, render via AntV SSR + Puppeteer to PNG
6. **Export**: Post-process slides with Flux 2 edit (optional)

Each stage writes a reviewable JSON artifact to `output/artifacts/`. Stages are cached — re-running uses existing artifacts unless `--regenerate` is specified.

## Prerequisites

- Node.js 18+
- A local LLM serving OpenAI-compatible chat completions (default: `localhost:1234`)
- [stable-diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp) with Flux 2 models (for illustration generation)

### LLM setup

Any server exposing `/v1/chat/completions` works. Example with LM Studio:

```
curl http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3.6-35b-a3b-mtp",
    "messages": [
      { "role": "system", "content": "You are a helpful assistant." },
      { "role": "user", "content": "Hello!" }
    ]
  }'
```

### Image generation setup

Flux 2 via stable-diffusion.cpp CLI:

```sh
# Generate
/Users/crn/dev/stable-diffusion.cpp/build/bin/sd-cli \
  --diffusion-model flux-2-klein-9b-Q4_0.gguf \
  --vae flux2_dev_diffusion_pytorch_model.safetensors \
  --llm Qwen3-8B-Q3_K_M.gguf \
  -p "A black and white cat" \
  --output flux2output.png --cfg-scale 1.0 \
  -v --offload-to-cpu --diffusion-fa -H 512 -W 512 --steps 8

# Edit
/Users/crn/dev/stable-diffusion.cpp/build/bin/sd-cli \
  --diffusion-model flux-2-klein-9b-Q4_0.gguf \
  --vae flux2_dev_diffusion_pytorch_model.safetensors \
  --llm Qwen3-8B-Q3_K_M.gguf \
  -r cat.png -p "change to an orange cat" \
  --cfg-scale 1.0 --sampling-method euler \
  -v --diffusion-fa --offload-to-cpu --steps 4 \
  --output orange-cat.png
```

## Install

```sh
npm install
npm run build
```

## Usage

```sh
# Basic
node dist/index.js "The history of quantum computing"

# Full options
node dist/index.js "quantum computing" \
  --slides 8 \
  --output ./quantum-slides \
  --llm-url http://localhost:1234 \
  --model qwen3.6-35b-a3b-mtp \
  --illustrations auto \
  --accept-all \
  --image-width 1920 \
  --image-height 1080
```

### CLI options

| Flag | Description | Default |
|---|---|---|
| `<input>` | Topic or text content | (required) |
| `-s, --slides <n>` | Target slide count | auto |
| `-o, --output <dir>` | Output directory | `./output` |
| `--llm-url <url>` | LLM API base URL | `http://localhost:1234` |
| `-m, --model <name>` | LLM model name | `qwen3.6-35b-a3b-mtp` |
| `--illustrations <mode>` | `on`, `off`, or `auto` | `auto` |
| `-y, --accept-all` | Auto-accept all LLM outputs | false |
| `--skip <stages>` | Skip stages (comma-separated) | `[]` |
| `--regenerate <stages>` | Force re-run stages | `[]` |
| `--from <stage>` | Resume from a specific stage | — |
| `--image-width <px>` | Slide width | `1920` |
| `--image-height <px>` | Slide height | `1080` |
| `--no-edit` | Disable post-processing | — |

### Stage control

```sh
# Skip mindmap and story, use cached or fallback
node dist/index.js "topic" --skip mindmap,story

# Regenerate only the slide designs
node dist/index.js "topic" --regenerate slides

# Resume from illustrations stage
node dist/index.js "topic" --from illustrations
```

## Output structure

```
output/
├── artifacts/
│   ├── 01-mindmap.json          # Concept hierarchy
│   ├── 02-story.json            # Story arc + slide plan
│   ├── 03-slides.json           # Template choices + DSL syntax
│   ├── 04-illustrations.json    # Illustration decisions
│   └── 05-rendered.json         # Render status
├── slides/
│   ├── slide-01.png
│   ├── slide-01.svg
│   └── ...
└── illustrations/
    ├── slide-03-illus.png
    └── ...
```

## Skills

Vendored from [AntV Infographic](https://github.com/antvis/Infographic/tree/main/skills):

- `skills/infographic-creator/SKILL.md` — full render guidance (HTML output)
- `skills/infographic-syntax-creator/` — DSL syntax generation rules + template reference

These are injected into LLM system prompts during the slide design stage.

## Architecture

See [DESIGN.md](./DESIGN.md) for the full architecture and data flow.

## Future work

See [FUTURE.md](./FUTURE.md) for planned features: partial regeneration, interactive mode, PowerPoint export.

## License

MIT
