import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import chalk from "chalk";
import type { MindmapArtifact, MindmapNode, PipelineOptions } from "../utils/types.js";
import { artifactPaths } from "../utils/types.js";
import { chatJson, type LLMOptions } from "../llm.js";
import { MINDMAP_SYSTEM, mindmapUser } from "../prompts/mindmap.js";

function normalizeMindmap(
  raw: Record<string, unknown>,
  fallbackInput: string,
): MindmapArtifact {
  const input = typeof raw.input === "string" ? raw.input : fallbackInput;
  const candidate = (raw.tree ?? raw) as Record<string, unknown> | undefined;
  if (
    candidate &&
    typeof candidate === "object" &&
    "label" in candidate &&
    typeof candidate.label === "string"
  ) {
    return { input, tree: candidate as unknown as MindmapNode };
  }
  return { input, tree: { label: input, children: [] } };
}

export async function runMindmap(
  opts: PipelineOptions,
  llmOpts: LLMOptions,
): Promise<MindmapArtifact> {
  const paths = artifactPaths(opts.outputDir);

  if (
    !opts.regenerate.includes("mindmap") &&
    !opts.skip.includes("mindmap") &&
    existsSync(paths.mindmap)
  ) {
    console.log(chalk.gray("  Using cached mindmap artifact"));
    const cached = JSON.parse(
      readFileSync(paths.mindmap, "utf-8"),
    ) as Record<string, unknown>;
    return normalizeMindmap(cached, opts.input);
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
  try {
    const raw = await chatJson<Record<string, unknown>>(
      llmOpts,
      MINDMAP_SYSTEM,
      mindmapUser(opts.input, opts.slides, opts.inputSource),
      {
        validate: (val) => {
          const obj = val as Record<string, unknown>;
          const tree = obj.tree ?? obj;
          if (!tree || typeof tree !== "object" || !("label" in tree)) {
            throw new Error("missing tree with label");
          }
        },
      },
    );

    const artifact = normalizeMindmap(raw, opts.input);
    mkdirSync(dirname(paths.mindmap), { recursive: true });
    writeFileSync(paths.mindmap, JSON.stringify(artifact, null, 2));
    return artifact;
  } catch (err) {
    console.log(chalk.red(`  LLM failed: ${(err as Error).message}`));
    console.log(chalk.yellow("  Falling back to minimal mindmap"));
    const artifact: MindmapArtifact = {
      input: opts.input,
      tree: { label: opts.input, children: [] },
    };
    mkdirSync(dirname(paths.mindmap), { recursive: true });
    writeFileSync(paths.mindmap, JSON.stringify(artifact, null, 2));
    return artifact;
  }
}
