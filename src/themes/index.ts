import type { Theme } from "./types.ts";
export type { Theme } from "./types.ts";
import { vanilla } from "./vanilla.ts";
import { softEditorial } from "./soft-editorial.ts";
import { blueProfessional } from "./blue-professional.ts";
import { monochrome } from "./monochrome.ts";
import { emeraldEditorial } from "./emerald-editorial.ts";
import { cobaltGrid } from "./cobalt-grid.ts";
import { neoGridBold } from "./neo-grid-bold.ts";
import { velvetDark } from "./velvet-dark.ts";
import { playful } from "./playful.ts";
import { rawGrid } from "./raw-grid.ts";
import { editorialTriTone } from "./editorial-tri-tone.ts";

const THEMES: Theme[] = [
  vanilla,
  softEditorial,
  blueProfessional,
  monochrome,
  emeraldEditorial,
  cobaltGrid,
  neoGridBold,
  velvetDark,
  playful,
  rawGrid,
  editorialTriTone,
];

const THEME_MAP = new Map(THEMES.map((t) => [t.slug, t]));

export function getTheme(slug: string): Theme {
  const theme = THEME_MAP.get(slug);
  if (!theme) {
    throw new Error(`Unknown theme: "${slug}". Available: ${THEMES.map((t) => t.slug).join(", ")}`);
  }
  return theme;
}

export function listThemes(): Theme[] {
  return [...THEMES];
}

export function getThemeSummaries(): string {
  return THEMES.map(
    (t) =>
      `- ${t.slug}: ${t.name} — ${t.description} [mood: ${
        t.mood.join(", ")
      }, formality: ${t.formality}, scheme: ${t.scheme}]`,
  ).join("\n");
}

export function isValidThemeSlug(slug: string): boolean {
  return THEME_MAP.has(slug);
}
