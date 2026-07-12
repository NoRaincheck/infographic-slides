import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import chalk from "chalk";
import type { PipelineOptions, SlideDesignArtifact, StoryArtifact } from "../utils/types.js";
import type { Theme } from "../themes/types.js";
import { artifactPaths } from "../utils/types.js";
import { chatJson, type LLMOptions } from "../llm.js";
import { slideDesignSystem, slideDesignUser } from "../prompts/slide-design.js";

export async function runSlideDesign(
  opts: PipelineOptions,
  llmOpts: LLMOptions,
  story: StoryArtifact,
  theme?: Theme,
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
    const palette = theme && theme.slug !== "vanilla" ? theme.palette.join(" ") : "#3b82f6 #8b5cf6 #f97316";
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
        `  palette ${palette}`,
      ].join("\n"),
    }));
    mkdirSync(dirname(paths.slideDesign), { recursive: true });
    writeFileSync(paths.slideDesign, JSON.stringify(artifacts, null, 2));
    return artifacts;
  }

  console.log(chalk.cyan("  Calling LLM..."));
  const artifacts = await chatJson<SlideDesignArtifact[]>(
    llmOpts,
    slideDesignSystem(theme),
    slideDesignUser(story.slides),
    {
      validate: (val) => {
        if (!Array.isArray(val)) throw new Error("expected array of slide designs");
        for (const s of val) {
          const slide = s as Record<string, unknown>;
          if (typeof slide.title !== "string") throw new Error("slide missing title");
          if (typeof slide.template !== "string") throw new Error("slide missing template");
          if (typeof slide.syntax !== "string") throw new Error("slide missing syntax");
        }
      },
    },
  );

  mkdirSync(dirname(paths.slideDesign), { recursive: true });
  writeFileSync(paths.slideDesign, JSON.stringify(artifacts, null, 2));

  return artifacts;
}
