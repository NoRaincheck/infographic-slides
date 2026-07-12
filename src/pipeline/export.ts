import { existsSync, readFileSync } from "node:fs";
import chalk from "chalk";
import type {
  RenderedSlide,
  SlideDesignArtifact,
  PipelineOptions,
} from "../utils/types.js";
import { artifactPaths } from "../utils/types.js";
import { editImage } from "../utils/image-gen.js";

export async function runExport(
  opts: PipelineOptions,
  slides: SlideDesignArtifact[],
  rendered: RenderedSlide[]
): Promise<void> {
  if (opts.noEdit) {
    console.log(chalk.gray("  Post-processing disabled (--no-edit)"));
    return;
  }

  const paths = artifactPaths(opts.outputDir);
  if (
    !opts.regenerate.includes("export") &&
    !opts.skip.includes("export") &&
    existsSync(paths.rendered)
  ) {
    console.log(chalk.gray("  Using cached render artifacts"));
    return;
  }

  // Only process slides that rendered successfully
  const successSlides = rendered.filter((r) => r.status === "ok");

  for (const slide of successSlides) {
    const slideDesign = slides.find(
      (s) => s.slideIndex === slide.slideIndex
    );
    if (!slideDesign) continue;

    // Placeholder: In future, LLM could decide per-slide edits
    // For now, skip unless explicitly enabled
    console.log(
      chalk.gray(
        `  Slide ${slide.slideIndex + 1}: ${slide.path} (no edit applied)`
      )
    );
  }
}
