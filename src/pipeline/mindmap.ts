import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import chalk from "chalk";
import type { MindmapArtifact, PipelineOptions } from "../utils/types.js";
import { artifactPaths } from "../utils/types.js";
import { chatJson, type LLMOptions } from "../llm.js";
import { MINDMAP_SYSTEM, mindmapUser } from "../prompts/mindmap.js";

export async function runMindmap(
  opts: PipelineOptions,
  llmOpts: LLMOptions
): Promise<MindmapArtifact> {
  const paths = artifactPaths(opts.outputDir);

  if (
    !opts.regenerate.includes("mindmap") &&
    !opts.skip.includes("mindmap") &&
    existsSync(paths.mindmap)
  ) {
    console.log(chalk.gray("  Using cached mindmap artifact"));
    return JSON.parse(readFileSync(paths.mindmap, "utf-8"));
  }

  if (opts.skip.includes("mindmap")) {
    console.log(chalk.yellow("  Skipped — generating minimal mindmap"));
    const artifact: MindmapArtifact = {
      input: opts.input,
      tree: { label: opts.input, children: [] },
    };
    mkdirSync(dirname(paths.mindmap), { recursive: true });
    writeFileSync(paths.mindmap, JSON.stringify(artifact, null, 2));
    return artifact;
  }

  console.log(chalk.cyan("  Calling LLM..."));
  const artifact = await chatJson<MindmapArtifact>(
    llmOpts,
    MINDMAP_SYSTEM,
    mindmapUser(opts.input, opts.slides)
  );

  artifact.input = opts.input;

  mkdirSync(dirname(paths.mindmap), { recursive: true });
  writeFileSync(paths.mindmap, JSON.stringify(artifact, null, 2));

  return artifact;
}
