import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);

const SD_CLI = "/Users/crn/dev/stable-diffusion.cpp/build/bin/sd-cli";
const DIFFUSION_MODEL = "flux-2-klein-9b-Q4_0.gguf";
const VAE = "flux2_dev_diffusion_pytorch_model.safetensors";
const LLM = "Qwen3-8B-Q3_K_M.gguf";

export interface ImageGenOptions {
  prompt: string;
  outputPath: string;
  width?: number;
  height?: number;
  steps?: number;
}

export async function generateImage(opts: ImageGenOptions): Promise<string> {
  const {
    prompt,
    outputPath,
    width = 512,
    height = 512,
    steps = 8,
  } = opts;

  const args = [
    "--diffusion-model", DIFFUSION_MODEL,
    "--vae", VAE,
    "--llm", LLM,
    "-p", prompt,
    "--output", outputPath,
    "--cfg-scale", "1.0",
    "-v",
    "--offload-to-cpu",
    "--diffusion-fa",
    "-H", String(height),
    "-W", String(width),
    "--steps", String(steps),
  ];

  await execFileAsync(SD_CLI, args, { timeout: 300_000 });
  return outputPath;
}

export interface ImageEditOptions {
  inputPath: string;
  prompt: string;
  outputPath: string;
  steps?: number;
}

export async function editImage(opts: ImageEditOptions): Promise<string> {
  const { inputPath, prompt, outputPath, steps = 4 } = opts;

  const args = [
    "--diffusion-model", DIFFUSION_MODEL,
    "--vae", VAE,
    "--llm", LLM,
    "-r", inputPath,
    "-p", prompt,
    "--cfg-scale", "1.0",
    "--sampling-method", "euler",
    "-v",
    "--diffusion-fa",
    "--offload-to-cpu",
    "--steps", String(steps),
    "--output", outputPath,
  ];

  await execFileAsync(SD_CLI, args, { timeout: 300_000 });
  return outputPath;
}
