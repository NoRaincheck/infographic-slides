import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import chalk from "chalk";
import type { MindmapArtifact, MindmapNode, PipelineOptions } from "../utils/types.ts";
import { artifactPaths } from "../utils/types.ts";
import { chatJson, type LLMOptions } from "../llm.ts";
import { MINDMAP_SYSTEM, mindmapUser } from "../prompts/mindmap.ts";

function normalizeMindmap(
  raw: Record<string, unknown>,
  fallbackInput: string,
  cliTheme?: string,
): MindmapArtifact {
  const input = typeof raw.input === "string" ? raw.input : fallbackInput;
  const candidate = (raw.tree ?? raw) as Record<string, unknown> | undefined;
  let tree: MindmapNode;
  if (
    candidate &&
    typeof candidate === "object" &&
    "label" in candidate &&
    typeof candidate.label === "string"
  ) {
    tree = candidate as unknown as MindmapNode;
  } else {
    tree = { label: input, children: [] };
  }

  let theme: string;
  if (cliTheme && cliTheme !== "auto") {
    theme = cliTheme;
  } else if (typeof raw.theme === "string" && raw.theme !== "auto") {
    theme = raw.theme;
  } else {
    theme = "vanilla";
  }

  return { input, tree, theme };
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
    return normalizeMindmap(cached, opts.input, opts.theme);
  }

  if (opts.skip.includes("mindmap")) {
    console.log(chalk.yellow("  Skipped — generating minimal mindmap"));
    const artifact: MindmapArtifact = {
      input: opts.input,
      tree: { label: opts.input, children: [] },
      theme: opts.theme && opts.theme !== "auto" ? opts.theme : "vanilla",
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

    const artifact = normalizeMindmap(raw, opts.input, opts.theme);
    mkdirSync(dirname(paths.mindmap), { recursive: true });
    writeFileSync(paths.mindmap, JSON.stringify(artifact, null, 2));
    return artifact;
  } catch (err) {
    console.log(chalk.red(`  LLM failed: ${(err as Error).message}`));
    console.log(chalk.yellow("  Falling back to minimal mindmap"));
    const artifact: MindmapArtifact = {
      input: opts.input,
      tree: { label: opts.input, children: [] },
      theme: opts.theme && opts.theme !== "auto" ? opts.theme : "vanilla",
    };
    mkdirSync(dirname(paths.mindmap), { recursive: true });
    writeFileSync(paths.mindmap, JSON.stringify(artifact, null, 2));
    return artifact;
  }
}
