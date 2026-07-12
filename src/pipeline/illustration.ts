import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import chalk from "chalk";
import type { IllustrationDecision, PipelineOptions, SlideDesignArtifact } from "../utils/types.js";
import type { Theme } from "../themes/types.js";
import { artifactPaths } from "../utils/types.js";
import { chatJson, type LLMOptions } from "../llm.js";
import { illustrationSystem, illustrationUser } from "../prompts/illustration.js";

export async function runIllustrations(
  opts: PipelineOptions,
  llmOpts: LLMOptions,
  slides: SlideDesignArtifact[],
  theme?: Theme,
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
      JSON.stringify(decisions, null, 2),
    );
    return decisions;
  }

  console.log(chalk.cyan("  Calling LLM..."));
  const decisions = await chatJson<IllustrationDecision[]>(
    llmOpts,
    illustrationSystem(theme),
    illustrationUser(slides),
    {
      validate: (val) => {
        if (!Array.isArray(val)) throw new Error("expected array of illustration decisions");
        for (const d of val) {
          const dec = d as Record<string, unknown>;
          if (typeof dec.slideIndex !== "number") throw new Error("decision missing slideIndex");
          if (dec.prompt !== null && typeof dec.prompt !== "string") {
            throw new Error("decision prompt must be string or null");
          }
        }
      },
    },
  );

  mkdirSync(dirname(paths.illustrations), { recursive: true });
  writeFileSync(paths.illustrations, JSON.stringify(decisions, null, 2));

  return decisions;
}
