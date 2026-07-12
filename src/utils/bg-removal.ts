import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
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
