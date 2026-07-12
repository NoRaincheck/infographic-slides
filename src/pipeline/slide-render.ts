import { existsSync, mkdirSync, readFileSync as readBinary, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import chalk from "chalk";
import type { IllustrationDecision, PipelineOptions, RenderedSlide, SlideDesignArtifact } from "../utils/types.js";
import { artifactPaths } from "../utils/types.js";
import { generateImage } from "../utils/image-gen.js";
import { renderSyntaxToPng } from "../utils/render.js";

export async function runRender(
  opts: PipelineOptions,
  slides: SlideDesignArtifact[],
  illustrations: IllustrationDecision[],
): Promise<RenderedSlide[]> {
  const paths = artifactPaths(opts.outputDir);
  const slidesDir = join(opts.outputDir, "slides");
  const illusDir = join(opts.outputDir, "illustrations");

  const forceRegenerate = opts.regenerate.includes("render");

  if (opts.skip.includes("render")) {
    console.log(chalk.yellow("  Skipped — using placeholder slides"));
    return slides.map((s) => ({
      slideIndex: s.slideIndex,
      status: "ok" as const,
      path: join(slidesDir, `slide-${String(s.slideIndex + 1).padStart(2, "0")}.png`),
    }));
  }

  mkdirSync(slidesDir, { recursive: true });
  mkdirSync(illusDir, { recursive: true });

  const results: RenderedSlide[] = [];

  for (const slide of slides) {
    const idx = slide.slideIndex;
    const slideNum = String(idx + 1).padStart(2, "0");
    const pngPath = join(slidesDir, `slide-${slideNum}.png`);

    if (!forceRegenerate && existsSync(pngPath)) {
      console.log(chalk.gray(`  Slide ${slideNum}: using cached`));
      results.push({ slideIndex: idx, status: "ok", path: pngPath });
      continue;
    }

    console.log(chalk.cyan(`  Rendering slide ${slideNum}: ${slide.title}`));

    let syntax = slide.syntax;

    if (opts.noTitle) {
      syntax = syntax.replace(/^ +title [^\n]*\n?/m, "");
    }
    const illusDecision = illustrations.find((d) => d.slideIndex === idx);

    if (illusDecision?.prompt && opts.illustrations !== "off") {
      const illusPath = join(illusDir, `slide-${slideNum}-illus.png`);
      if (!existsSync(illusPath)) {
        console.log(chalk.gray(`    Generating illustration...`));
        try {
          await generateImage({
            prompt: illusDecision.prompt,
            outputPath: illusPath,
            width: 512,
            height: 512,
          });
        } catch (err) {
          console.log(
            chalk.yellow(`    Illustration failed: ${(err as Error).message}`),
          );
          results.push({
            slideIndex: idx,
            status: "ok",
            path: pngPath,
          });
          continue;
        }
      } else {
        console.log(chalk.gray(`    Using cached illustration`));
      }

      // Embed illustration as base64 in syntax
      const illusBuffer = readBinary(illusPath);
      const base64 = illusBuffer.toString("base64");
      const dataUri = `data:image/png;base64,${base64}`;

      // Add illus to data block
      syntax = syntax.replace(
        /(\ntheme)/,
        `\n  illus ${dataUri}$1`,
      );
    }

    // Render with AntV SSR
    try {
      const { pngPath: renderedPng, svgPath } = await renderSyntaxToPng({
        syntax,
        outputPath: pngPath,
        width: opts.imageWidth,
        height: opts.imageHeight,
      });

      results.push({
        slideIndex: idx,
        status: "ok",
        path: renderedPng,
        svgPath,
        ...(illusDecision?.prompt && opts.illustrations !== "off"
          ? { illustration: join(illusDir, `slide-${slideNum}-illus.png`) }
          : {}),
      });
    } catch (err) {
      results.push({
        slideIndex: idx,
        status: "error",
        path: pngPath,
        error: (err as Error).message,
      });
      console.log(
        chalk.red(`    Render failed: ${(err as Error).message}`),
      );
    }
  }

  mkdirSync(dirname(paths.rendered), { recursive: true });
  writeFileSync(paths.rendered, JSON.stringify(results, null, 2));

  return results;
}
