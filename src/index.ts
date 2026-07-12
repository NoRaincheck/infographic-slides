#!/usr/bin/env -S deno run

import { Command } from "commander";
import chalk from "chalk";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import process from "node:process";
import type { PipelineOptions, StageName } from "./utils/types.ts";
import type { LLMOptions } from "./llm.ts";
import type { Theme } from "./themes/types.ts";
import { getTheme } from "./themes/index.ts";
import { runMindmap } from "./pipeline/mindmap.ts";
import { runStory } from "./pipeline/story.ts";
import { runSlideDesign } from "./pipeline/slide-design.ts";
import { runIllustrations } from "./pipeline/illustration.ts";
import { runRender } from "./pipeline/slide-render.ts";
import { runThemeSelection } from "./pipeline/theme-select.ts";

function parseList(val: string): string[] {
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const program = new Command();

program
  .name("infographic-slides")
  .description("Generate infographic slide decks from text using local LLMs")
  .argument("<input>", "Topic text, or path to a .txt/.md file")
  .option("-s, --slides <n>", "Target number of slides", (v) => Number.parseInt(v, 10))
  .option("-o, --output <dir>", "Output directory", "./output")
  .option("--llm-url <url>", "LLM API base URL", "http://localhost:1234")
  .option("-m, --model <name>", "LLM model name", "qwen3.6-35b-a3b-mtp")
  .option(
    "--illustrations <mode>",
    "Illustration generation: on, off, auto",
    "auto",
  )
  .option("-y, --accept-all", "Auto-accept all LLM outputs", false)
  .option("--skip <stages>", "Skip stages (comma-separated)", parseList, [])
  .option(
    "--regenerate <stages>",
    "Force regenerate stages (comma-separated)",
    parseList,
    [],
  )
  .option("--from <stage>", "Resume from a specific stage")
  .option("--image-width <px>", "Slide image width", (v) => Number.parseInt(v, 10), 1920)
  .option("--image-height <px>", "Slide image height", (v) => Number.parseInt(v, 10), 1080)
  .option("--no-edit", "Disable post-processing image edits")
  .option("--no-title", "Strip title text from rendered slides")
  .option("-t, --theme <slug>", "Theme slug, or 'auto' for automatic selection", "auto")
  .option("--html-text", "Render text as HTML overlay instead of SVG foreignObject", false)
  .action(async (input: string, opts: Record<string, unknown>) => {
    let inputText: string;
    let inputSource: "text" | "file";

    if (
      existsSync(input) &&
      statSync(input).isFile()
    ) {
      inputText = readFileSync(input, "utf-8");
      inputSource = "file";
      console.log(chalk.gray(`  Read input from file: ${input}`));
    } else {
      inputText = input;
      inputSource = "text";
    }

    const options: PipelineOptions = {
      input: inputText,
      inputSource,
      slides: opts.slides as number | undefined,
      outputDir: opts.output as string,
      llmUrl: opts.llmUrl as string,
      model: opts.model as string,
      illustrations: opts.illustrations as "on" | "off" | "auto",
      acceptAll: opts.acceptAll as boolean,
      skip: opts.skip as string[],
      regenerate: opts.regenerate as string[],
      from: opts.from as string | undefined,
      imageWidth: opts.imageWidth as number,
      imageHeight: opts.imageHeight as number,
      noEdit: (opts.edit as boolean) === false,
      noTitle: (opts.title as boolean) === false,
      theme: opts.theme as string,
      htmlText: opts.htmlText as boolean,
    };

    const llmOpts: LLMOptions = {
      url: options.llmUrl,
      model: options.model,
    };

    mkdirSync(options.outputDir, { recursive: true });

    const stages: { name: StageName; label: string; run: () => Promise<void> }[] = [];
    let themeResult: Theme | undefined;
    let mindmapResult: Awaited<ReturnType<typeof runMindmap>> | undefined;
    let storyResult: Awaited<ReturnType<typeof runStory>> | undefined;
    let slidesResult: Awaited<ReturnType<typeof runSlideDesign>> | undefined;
    let illusResult: Awaited<ReturnType<typeof runIllustrations>> | undefined;

    stages.push({
      name: "mindmap",
      label: "Mindmap",
      run: async () => {
        mindmapResult = await runMindmap(options, llmOpts);
        const nodeCount = mindmapResult.tree ? countNodes(mindmapResult.tree) : 0;
        console.log(
          chalk.green(
            `  Tree: ${mindmapResult.tree?.label ?? mindmapResult.input} (${nodeCount} nodes)`,
          ),
        );
      },
    });

    stages.push({
      name: "story",
      label: "Story",
      run: async () => {
        if (!mindmapResult) throw new Error("Mindmap must run first");
        storyResult = await runStory(options, llmOpts, mindmapResult);
        console.log(
          chalk.green(
            `  "${storyResult.storyTitle}" — ${storyResult.targetSlides} slides`,
          ),
        );
      },
    });

    stages.push({
      name: "slides",
      label: "Slide Design",
      run: async () => {
        if (!storyResult) throw new Error("Story must run first");
        slidesResult = await runSlideDesign(options, llmOpts, storyResult, themeResult);
        console.log(chalk.green(`  ${slidesResult.length} slides designed`));
      },
    });

    stages.push({
      name: "illustrations",
      label: "Illustrations",
      run: async () => {
        if (!slidesResult) throw new Error("Slide design must run first");
        illusResult = await runIllustrations(options, llmOpts, slidesResult, themeResult);
        const count = illusResult.filter((d) => d.prompt !== null).length;
        console.log(chalk.green(`  ${count} illustrations planned`));
      },
    });

    stages.push({
      name: "render",
      label: "Render",
      run: async () => {
        if (!slidesResult) throw new Error("Slide design must run first");
        if (!illusResult) throw new Error("Illustrations must run first");
        const rendered = await runRender(options, slidesResult, illusResult, themeResult, llmOpts);
        const ok = rendered.filter((r) => r.status === "ok").length;
        const fail = rendered.filter((r) => r.status === "error").length;
        console.log(chalk.green(`  ${ok} rendered, ${fail} failed`));
      },
    });

    stages.push({
      name: "export",
      label: "Export",
      // deno-lint-ignore require-await
      run: async () => {
        // Export is handled inline for now
        console.log(chalk.gray("  Post-processing (placeholder)"));
      },
    });

    // Determine which stages to run
    const fromIndex = options.from ? stages.findIndex((s) => s.name === options.from) : 0;

    const inputLabel = inputSource === "file" ? `${input} (file)` : `"${options.input}"`;
    console.log(
      chalk.bold(`\nInfographic Slides: ${inputLabel}\n`),
    );

    // Theme resolution:
    // 1. CLI --theme <slug> overrides everything
    // 2. Mindmap artifact's theme is used when CLI is "auto"
    // 3. LLM theme selection as final fallback
    if (options.theme && options.theme !== "auto") {
      console.log(chalk.bold("[1/theme] Theme"));
      console.log(chalk.gray(`  Using CLI theme: ${options.theme}`));
      themeResult = getTheme(options.theme);
    } else if (fromIndex === 0) {
      // Run mindmap first so we can read its theme
      console.log(chalk.bold(`[1/${stages.length}] Mindmap`));
      try {
        const mindmapStage = stages.find((s) => s.name === "mindmap")!;
        await mindmapStage.run();
      } catch (err) {
        console.log(chalk.red(`  Failed: ${(err as Error).message}`));
        process.exit(1);
      }

      // Use mindmap's theme (LLM picked it) if available
      if (mindmapResult?.theme && mindmapResult.theme !== "auto") {
        console.log(chalk.gray(`  Using mindmap theme: ${mindmapResult.theme}`));
        themeResult = getTheme(mindmapResult.theme);
      } else {
        // Fallback to LLM theme selection
        console.log(chalk.bold("[theme] Theme"));
        try {
          themeResult = await runThemeSelection(options, llmOpts);
        } catch (err) {
          console.log(chalk.red(`  Failed: ${(err as Error).message}`));
          process.exit(1);
        }
      }
    }

    // Run remaining stages (skip mindmap if already ran above)
    for (let i = Math.max(0, fromIndex); i < stages.length; i++) {
      const stage = stages[i];
      if (stage.name === "mindmap" && mindmapResult) continue;
      console.log(chalk.bold(`[${i + 1}/${stages.length}] ${stage.label}`));

      try {
        await stage.run();
      } catch (err) {
        console.log(chalk.red(`  Failed: ${(err as Error).message}`));
        process.exit(1);
      }
    }

    console.log(
      chalk.bold.green(
        `\nDone! Slides saved to ${options.outputDir}/slides/\n`,
      ),
    );
  });

function countNodes(node: { children?: unknown[] }): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child as { children?: unknown[] });
    }
  }
  return count;
}

program.parse();
