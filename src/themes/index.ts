import type { Theme } from "./types.js";
export type { Theme } from "./types.js";
import { vanilla } from "./vanilla.js";
import { softEditorial } from "./soft-editorial.js";
import { blueProfessional } from "./blue-professional.js";
import { monochrome } from "./monochrome.js";
import { emeraldEditorial } from "./emerald-editorial.js";
import { cobaltGrid } from "./cobalt-grid.js";
import { neoGridBold } from "./neo-grid-bold.js";
import { velvetDark } from "./velvet-dark.js";
import { playful } from "./playful.js";
import { rawGrid } from "./raw-grid.js";
import { editorialTriTone } from "./editorial-tri-tone.js";

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
      `- ${t.slug}: ${t.name} — ${t.description} [mood: ${t.mood.join(", ")}, formality: ${t.formality}, scheme: ${t.scheme}]`,
  ).join("\n");
}

export function isValidThemeSlug(slug: string): boolean {
  return THEME_MAP.has(slug);
}
