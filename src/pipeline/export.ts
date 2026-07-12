import { existsSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import type { PipelineOptions, RenderedSlide } from "../utils/types.ts";

export async function runExport(
  opts: PipelineOptions,
  rendered: RenderedSlide[],
): Promise<void> {
  const pdfPath = join(opts.outputDir, "output.pdf");

  if (
    !opts.regenerate.includes("export") &&
    !opts.skip.includes("export") &&
    existsSync(pdfPath)
  ) {
    console.log(chalk.gray("  Using cached PDF"));
    return;
  }

  const successSlides = rendered
    .filter((r) => r.status === "ok")
    .sort((a, b) => a.slideIndex - b.slideIndex);

  if (successSlides.length === 0) {
    console.log(chalk.yellow("  No rendered slides to export"));
    return;
  }

  const pngPaths = successSlides.map((r) => r.path);
  for (const p of pngPaths) {
    if (!existsSync(p)) {
      console.log(chalk.red(`  Missing slide: ${p}`));
      return;
    }
  }

  console.log(chalk.gray(`  Combining ${pngPaths.length} slides into PDF...`));

  const cmd = new Deno.Command("convert", {
    args: [...pngPaths, pdfPath],
    stderr: "piped",
  });

  const { code, stderr } = await cmd.output();

  if (code !== 0) {
    const msg = new TextDecoder().decode(stderr);
    throw new Error(`ImageMagick convert failed (exit ${code}): ${msg}`);
  }

  console.log(chalk.green(`  PDF saved to ${pdfPath}`));
}
