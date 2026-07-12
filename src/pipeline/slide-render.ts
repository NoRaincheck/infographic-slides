import { existsSync, mkdirSync, readFileSync as readBinary, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import chalk from "chalk";
import type { IllustrationDecision, PipelineOptions, RenderedSlide, SlideDesignArtifact } from "../utils/types.ts";
import type { Theme } from "../themes/types.ts";
import { artifactPaths } from "../utils/types.ts";
import { generateImage } from "../utils/image-gen.ts";
import { removeBackground } from "../utils/bg-removal.ts";
import { compositeIllustration } from "../utils/composite.ts";
import { renderSyntaxToPng } from "../utils/render.ts";
import { chatJsonVision, type LLMOptions } from "../llm.ts";
import {
  type IllustrationVerdict,
  illustrationVerifySystem,
  illustrationVerifyUser,
} from "../prompts/illustration-verify.ts";

export async function runRender(
  opts: PipelineOptions,
  slides: SlideDesignArtifact[],
  illustrations: IllustrationDecision[],
  theme?: Theme,
  llmOpts?: LLMOptions,
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
    const hasIllustration = illusDecision?.prompt && opts.illustrations !== "off";

    // Generate and prepare illustration if needed
    let transparentIllusPath: string | undefined;
    if (hasIllustration) {
      const illusPath = join(illusDir, `slide-${slideNum}-illus.png`);
      const transparentPath = join(illusDir, `slide-${slideNum}-illus-transparent.png`);

      if (!existsSync(illusPath)) {
        console.log(chalk.gray(`    Generating illustration...`));
        try {
          await generateImage({
            prompt: illusDecision!.prompt!,
            outputPath: illusPath,
            width: 512,
            height: 512,
          });
        } catch (err) {
          console.log(
            chalk.yellow(`    Illustration generation failed: ${(err as Error).message}`),
          );
        }
      } else {
        console.log(chalk.gray(`    Using cached illustration`));
      }

      if (existsSync(illusPath)) {
        if (!existsSync(transparentPath)) {
          console.log(chalk.gray(`    Removing background...`));
          try {
            await removeBackground({ inputPath: illusPath, outputPath: transparentPath });
            transparentIllusPath = transparentPath;
          } catch (err) {
            console.log(
              chalk.yellow(`    Background removal failed: ${(err as Error).message}`),
            );
          }
        } else {
          console.log(chalk.gray(`    Using cached transparent illustration`));
          transparentIllusPath = transparentPath;
        }
      }
    }

    // Render slide with AntV SSR (no Illus in syntax)
    try {
      const { pngPath: renderedPng, svgPath } = await renderSyntaxToPng({
        syntax,
        outputPath: pngPath,
        width: opts.imageWidth,
        height: opts.imageHeight,
        theme,
        htmlText: opts.htmlText,
        bodyTop: slide.bodyTop,
        bodyBottom: slide.bodyBottom,
      });

      // Composite transparent illustration onto rendered slide
      let finalPng = renderedPng;
      if (transparentIllusPath && existsSync(transparentIllusPath)) {
        console.log(chalk.gray(`    Compositing illustration...`));
        try {
          const compositedPath = join(slidesDir, `slide-${slideNum}-composited.png`);
          await compositeIllustration({
            slidePng: renderedPng,
            illustrationPng: transparentIllusPath,
            outputPath: compositedPath,
          });
          finalPng = compositedPath;
        } catch (err) {
          console.log(
            chalk.yellow(`    Compositing failed: ${(err as Error).message}`),
          );
        }
      }

      // Optional LLM vision verification
      if (finalPng !== renderedPng && llmOpts && !opts.acceptAll) {
        try {
          const compositedBuf = readBinary(finalPng);
          const compositedB64 = compositedBuf.toString("base64");
          const verdict = await chatJsonVision<IllustrationVerdict>(
            llmOpts,
            illustrationVerifySystem(),
            illustrationVerifyUser(slide.title, compositedB64),
          );
          if (!verdict.ok) {
            console.log(
              chalk.yellow(`    Illustration issues: ${verdict.issues}`),
            );
          }
        } catch (err) {
          console.log(
            chalk.gray(`    Vision verification skipped: ${(err as Error).message}`),
          );
        }
      }

      results.push({
        slideIndex: idx,
        status: "ok",
        path: finalPng,
        svgPath,
        ...(hasIllustration
          ? { illustration: transparentIllusPath ?? join(illusDir, `slide-${slideNum}-illus.png`) }
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
