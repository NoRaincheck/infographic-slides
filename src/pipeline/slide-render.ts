import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readFileSync as readBinary,
} from "node:fs";
import { dirname, join } from "node:path";
import chalk from "chalk";
import type {
  SlideDesignArtifact,
  IllustrationDecision,
  RenderedSlide,
  PipelineOptions,
} from "../utils/types.js";
import { artifactPaths } from "../utils/types.js";
import { generateImage } from "../utils/image-gen.js";
import { renderSyntaxToPng } from "../utils/render.js";

export async function runRender(
  opts: PipelineOptions,
  slides: SlideDesignArtifact[],
  illustrations: IllustrationDecision[]
): Promise<RenderedSlide[]> {
  const paths = artifactPaths(opts.outputDir);
  const slidesDir = join(opts.outputDir, "slides");
  const illusDir = join(opts.outputDir, "illustrations");

  if (
    !opts.regenerate.includes("render") &&
    !opts.skip.includes("render") &&
    existsSync(paths.rendered)
  ) {
    console.log(chalk.gray("  Using cached render artifact"));
    return JSON.parse(readFileSync(paths.rendered, "utf-8"));
  }

  mkdirSync(slidesDir, { recursive: true });
  mkdirSync(illusDir, { recursive: true });

  const results: RenderedSlide[] = [];

  for (const slide of slides) {
    const idx = slide.slideIndex;
    const slideNum = String(idx + 1).padStart(2, "0");
    const pngPath = join(slidesDir, `slide-${slideNum}.png`);

    console.log(chalk.cyan(`  Rendering slide ${slideNum}: ${slide.title}`));

    let syntax = slide.syntax;
    const illusDecision = illustrations.find((d) => d.slideIndex === idx);

    // Generate illustration if needed
    if (illusDecision?.prompt && opts.illustrations !== "off") {
      console.log(chalk.gray(`    Generating illustration...`));
      const illusPath = join(illusDir, `slide-${slideNum}-illus.png`);
      try {
        await generateImage({
          prompt: illusDecision.prompt,
          outputPath: illusPath,
          width: 512,
          height: 512,
        });

        // Embed illustration as base64 in syntax
        const illusBuffer = readBinary(illusPath);
        const base64 = illusBuffer.toString("base64");
        const dataUri = `data:image/png;base64,${base64}`;

        // Add illus to data block
        syntax = syntax.replace(
          /(\ntheme)/,
          `\n  illus ${dataUri}$1`
        );

        results.push({
          slideIndex: idx,
          status: "ok",
          path: pngPath,
          illustration: illusPath,
        });
      } catch (err) {
        console.log(
          chalk.yellow(`    Illustration failed: ${(err as Error).message}`)
        );
        results.push({
          slideIndex: idx,
          status: "ok",
          path: pngPath,
        });
      }
    } else {
      results.push({
        slideIndex: idx,
        status: "ok",
        path: pngPath,
      });
    }

    // Render with AntV SSR
    try {
      const { pngPath: renderedPng, svgPath } = await renderSyntaxToPng({
        syntax,
        outputPath: pngPath,
        width: opts.imageWidth,
        height: opts.imageHeight,
      });

      const existing = results.find((r) => r.slideIndex === idx);
      if (existing) {
        existing.path = renderedPng;
        existing.svgPath = svgPath;
      }
    } catch (err) {
      const existing = results.find((r) => r.slideIndex === idx);
      if (existing) {
        existing.status = "error";
        existing.error = (err as Error).message;
      } else {
        results.push({
          slideIndex: idx,
          status: "error",
          path: pngPath,
          error: (err as Error).message,
        });
      }
      console.log(
        chalk.red(`    Render failed: ${(err as Error).message}`)
      );
    }
  }

  mkdirSync(dirname(paths.rendered), { recursive: true });
  writeFileSync(paths.rendered, JSON.stringify(results, null, 2));

  return results;
}
