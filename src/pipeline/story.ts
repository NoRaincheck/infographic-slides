import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import chalk from "chalk";
import type {
  MindmapArtifact,
  StoryArtifact,
  PipelineOptions,
} from "../utils/types.js";
import { artifactPaths } from "../utils/types.js";
import { chatJson, type LLMOptions } from "../llm.js";
import { STORY_SYSTEM, storyUser } from "../prompts/story.js";

export async function runStory(
  opts: PipelineOptions,
  llmOpts: LLMOptions,
  mindmap: MindmapArtifact
): Promise<StoryArtifact> {
  const paths = artifactPaths(opts.outputDir);

  if (
    !opts.regenerate.includes("story") &&
    !opts.skip.includes("story") &&
    existsSync(paths.story)
  ) {
    console.log(chalk.gray("  Using cached story artifact"));
    return JSON.parse(readFileSync(paths.story, "utf-8"));
  }

  if (opts.skip.includes("story")) {
    console.log(chalk.yellow("  Skipped — generating minimal story"));
    const artifact: StoryArtifact = {
      storyTitle: mindmap.input,
      targetSlides: opts.slides ?? 5,
      slides: mindmap.tree.children?.map((c) => ({
        title: c.label,
        description: "",
        keyPoints: c.children?.map((gc) => gc.label) ?? [],
      })) ?? [{ title: mindmap.input, description: "", keyPoints: [] }],
    };
    mkdirSync(dirname(paths.story), { recursive: true });
    writeFileSync(paths.story, JSON.stringify(artifact, null, 2));
    return artifact;
  }

  console.log(chalk.cyan("  Calling LLM..."));
  const artifact = await chatJson<StoryArtifact>(
    llmOpts,
    STORY_SYSTEM,
    storyUser(mindmap.tree, opts.slides, opts.inputSource, opts.input)
  );

  mkdirSync(dirname(paths.story), { recursive: true });
  writeFileSync(paths.story, JSON.stringify(artifact, null, 2));

  return artifact;
}
