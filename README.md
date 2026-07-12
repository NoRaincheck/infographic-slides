# Infographic Slides

A CLI tool that generates infographic slide decks from text using purely local LLMs and image generation. A modern
re-implementation of [lida](https://github.com/microsoft/lida) using
[AntV Infographic](https://infographic.antv.vision/) for rendering.

## How it works

Mindmap → Story → Slide Design → Illustrations → Render → Export. Each stage calls a local LLM, writes a JSON artifact
to `output/artifacts/`, and caches it for the next run.

## Prerequisites

- Deno 2.0+
- A local LLM serving OpenAI-compatible chat completions (default: `localhost:1234`)
- [stable-diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp) with Flux 2 models (for illustration
  generation)

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

No build step required. Deno caches dependencies on first run.

```sh
deno task dev --help
```

## Usage

```sh
# Basic
deno task dev "The history of quantum computing"

# Full options
deno task dev "quantum computing" \
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

| Flag                     | Description                   | Default                 |
| ------------------------ | ----------------------------- | ----------------------- |
| `<input>`                | Topic or text content         | (required)              |
| `-s, --slides <n>`       | Target slide count            | auto                    |
| `-o, --output <dir>`     | Output directory              | `./output`              |
| `--llm-url <url>`        | LLM API base URL              | `http://localhost:1234` |
| `-m, --model <name>`     | LLM model name                | `qwen3.6-35b-a3b-mtp`   |
| `--illustrations <mode>` | `on`, `off`, or `auto`        | `auto`                  |
| `-y, --accept-all`       | Auto-accept all LLM outputs   | false                   |
| `--skip <stages>`        | Skip stages (comma-separated) | `[]`                    |
| `--regenerate <stages>`  | Force re-run stages           | `[]`                    |
| `--from <stage>`         | Resume from a specific stage  | —                       |
| `--image-width <px>`     | Slide width                   | `1920`                  |
| `--image-height <px>`    | Slide height                  | `1080`                  |
| `--no-edit`              | Disable post-processing       | —                       |

### Stage control

```sh
# Skip mindmap and story, use cached or fallback
deno task dev "topic" --skip mindmap,story

# Regenerate only the slide designs
deno task dev "topic" --regenerate slides

# Resume from illustrations stage
deno task dev "topic" --from illustrations
```

## Docs

- [DESIGN.md](./DESIGN.md) — architecture, data flow, LLM resilience, artifact formats
- [FUTURE.md](./FUTURE.md) — planned features: partial regeneration, interactive mode, PowerPoint export
- [AGENTS.md](./AGENTS.md) — instructions for AI agents working on this codebase

## License

MIT
