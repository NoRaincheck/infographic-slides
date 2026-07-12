import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import chalk from "chalk";
import type {
  StoryArtifact,
  SlideDesignArtifact,
  PipelineOptions,
} from "../utils/types.js";
import { artifactPaths } from "../utils/types.js";
import { chatJson, type LLMOptions } from "../llm.js";
import {
  slideDesignSystem,
  slideDesignUser,
} from "../prompts/slide-design.js";

export async function runSlideDesign(
  opts: PipelineOptions,
  llmOpts: LLMOptions,
  story: StoryArtifact
): Promise<SlideDesignArtifact[]> {
  const paths = artifactPaths(opts.outputDir);

  if (
    !opts.regenerate.includes("slides") &&
    !opts.skip.includes("slides") &&
    existsSync(paths.slideDesign)
  ) {
    console.log(chalk.gray("  Using cached slide design artifact"));
    return JSON.parse(readFileSync(paths.slideDesign, "utf-8"));
  }

  if (opts.skip.includes("slides")) {
    console.log(chalk.yellow("  Skipped — generating minimal slide designs"));
    const artifacts: SlideDesignArtifact[] = story.slides.map((s, i) => ({
      slideIndex: i,
      title: s.title,
      template: "list-row-horizontal-icon-arrow",
      syntax: [
        "infographic list-row-horizontal-icon-arrow",
        "data",
        `  title ${s.title}`,
        "  lists",
        ...s.keyPoints.map((kp) => `    - label ${kp}\n      icon star`),
        "theme",
        "  palette #3b82f6 #8b5cf6 #f97316",
      ].join("\n"),
    }));
    mkdirSync(dirname(paths.slideDesign), { recursive: true });
    writeFileSync(paths.slideDesign, JSON.stringify(artifacts, null, 2));
    return artifacts;
  }

  console.log(chalk.cyan("  Calling LLM..."));
  const artifacts = await chatJson<SlideDesignArtifact[]>(
    llmOpts,
    slideDesignSystem(),
    slideDesignUser(story.slides)
  );

  mkdirSync(dirname(paths.slideDesign), { recursive: true });
  writeFileSync(paths.slideDesign, JSON.stringify(artifacts, null, 2));

  return artifacts;
}
