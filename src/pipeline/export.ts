import { existsSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import type { PipelineOptions, RenderedSlide, SlideDesignArtifact } from "../utils/types.ts";
import { artifactPaths } from "../utils/types.ts";

export function runExport(
  opts: PipelineOptions,
  slides: SlideDesignArtifact[],
  rendered: RenderedSlide[],
): Promise<void> {
  if (opts.noEdit) {
    console.log(chalk.gray("  Post-processing disabled (--no-edit)"));
    return;
  }

  const paths = artifactPaths(opts.outputDir);
  const slidesDir = join(opts.outputDir, "slides");
  if (
    !opts.regenerate.includes("export") &&
    !opts.skip.includes("export") &&
    existsSync(paths.rendered) &&
    existsSync(slidesDir)
  ) {
    console.log(chalk.gray("  Using cached render artifacts"));
    return;
  }

  // Only process slides that rendered successfully
  const successSlides = rendered.filter((r) => r.status === "ok");

  for (const slide of successSlides) {
    const slideDesign = slides.find(
      (s) => s.slideIndex === slide.slideIndex,
    );
    if (!slideDesign) continue;

    // Placeholder: In future, LLM could decide per-slide edits
    // For now, skip unless explicitly enabled
    console.log(
      chalk.gray(
        `  Slide ${slide.slideIndex + 1}: ${slide.path} (no edit applied)`,
      ),
    );
  }
}
