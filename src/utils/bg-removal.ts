import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);

const __dirname = import.meta.dirname ?? resolve(new URL(import.meta.url).pathname, "..");
const PROJECT_ROOT = resolve(__dirname, "../..");
const SCRIPT_PATH = resolve(PROJECT_ROOT, "models/birefnet_removal.py");

export interface BgRemovalOptions {
  inputPath: string;
  outputPath: string;
}

export async function removeBackground(
  opts: BgRemovalOptions,
): Promise<string> {
  const { inputPath, outputPath } = opts;

  await execFileAsync(
    "uv",
    [
      "run",
      SCRIPT_PATH,
      "--input",
      inputPath,
      "--output",
      outputPath,
    ],
    {
      cwd: PROJECT_ROOT,
      timeout: 120_000,
    },
  );

  return outputPath;
}
