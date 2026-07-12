import type { Theme } from "./types.ts";

export const editorialTriTone: Theme = {
  slug: "editorial-tri-tone",
  name: "Editorial Tri-Tone",
  description: "Three-color editorial system: dusty pink, mustard cream, and deep burgundy",
  palette: ["#c97b84", "#e8d5a3", "#6b2737", "#f5efe0", "#3d1520"],
  fontFamily: "'Bricolage Grotesque', sans-serif",
  css: {
    background: "#f5efe0",
    textColor: "#3d1520",
    fontImports:
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,400;12..96,600;12..96,700;12..96,800&family=Instrument+Serif:ital@0;1&display=swap",
    bodyFontFamily: "'Bricolage Grotesque', 'Instrument Serif', sans-serif",
  },
  preferredLayouts: ["list-row-horizontal-icon-arrow", "number-big", "chart-bar-horizontal"],
  avoidLayouts: [],
  layoutHints:
    "Warm, intentional, moody editorial. Favor magazine-spread layouts with clear tri-tone color blocking. Use dusty pink and mustard cream as alternating accent backgrounds on stat cards and list items. Keep the deep burgundy for strong headlines. Stylish and considered.",
  mood: ["editorial", "warm", "intentional", "moody", "stylish", "literary"],
  formality: "medium-high",
  scheme: "mixed",
};
