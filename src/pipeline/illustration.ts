import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import chalk from "chalk";
import type {
  SlideDesignArtifact,
  IllustrationDecision,
  PipelineOptions,
} from "../utils/types.js";
import { artifactPaths } from "../utils/types.js";
import { chatJson, type LLMOptions } from "../llm.js";
import {
  ILLUSTRATION_SYSTEM,
  illustrationUser,
} from "../prompts/illustration.js";

export async function runIllustrations(
  opts: PipelineOptions,
  llmOpts: LLMOptions,
  slides: SlideDesignArtifact[]
): Promise<IllustrationDecision[]> {
  const paths = artifactPaths(opts.outputDir);

  if (
    !opts.regenerate.includes("illustrations") &&
    !opts.skip.includes("illustrations") &&
    existsSync(paths.illustrations)
  ) {
    console.log(chalk.gray("  Using cached illustration decisions"));
    return JSON.parse(readFileSync(paths.illustrations, "utf-8"));
  }

  if (
    opts.skip.includes("illustrations") ||
    opts.illustrations === "off"
  ) {
    console.log(chalk.yellow("  Skipped — no illustrations"));
    const decisions: IllustrationDecision[] = slides.map((s) => ({
      slideIndex: s.slideIndex,
      prompt: null,
    }));
    mkdirSync(dirname(paths.illustrations), { recursive: true });
    writeFileSync(
      paths.illustrations,
      JSON.stringify(decisions, null, 2)
    );
    return decisions;
  }

  console.log(chalk.cyan("  Calling LLM..."));
  const decisions = await chatJson<IllustrationDecision[]>(
    llmOpts,
    ILLUSTRATION_SYSTEM,
    illustrationUser(slides)
  );

  mkdirSync(dirname(paths.illustrations), { recursive: true });
  writeFileSync(paths.illustrations, JSON.stringify(decisions, null, 2));

  return decisions;
}
