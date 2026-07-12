import chalk from "chalk";
import type { PipelineOptions } from "../utils/types.ts";
import type { LLMOptions } from "../llm.ts";
import { chatJson } from "../llm.ts";
import { getTheme, type Theme } from "../themes/index.ts";
import { THEME_SELECTION_SYSTEM, themeSelectionUser } from "../prompts/theme-selection.ts";

interface ThemeSelectionResult {
  theme: string;
  reason: string;
}

export async function runThemeSelection(
  opts: PipelineOptions,
  llmOpts: LLMOptions,
): Promise<Theme> {
  if (opts.theme && opts.theme !== "auto") {
    const theme = getTheme(opts.theme);
    console.log(chalk.gray(`  Using specified theme: ${theme.name}`));
    return theme;
  }

  console.log(chalk.cyan("  Selecting theme via LLM..."));
  try {
    const result = await chatJson<ThemeSelectionResult>(
      llmOpts,
      THEME_SELECTION_SYSTEM,
      themeSelectionUser(opts.input),
      {
        validate: (val) => {
          const r = val as Record<string, unknown>;
          if (typeof r.theme !== "string") throw new Error("missing theme slug");
        },
      },
    );

    const theme = getTheme(result.theme);
    console.log(chalk.green(`  Selected: ${theme.name} — ${result.reason}`));
    return theme;
  } catch (err) {
    console.log(chalk.yellow(`  Theme selection failed, falling back to vanilla: ${(err as Error).message}`));
    return getTheme("vanilla");
  }
}
