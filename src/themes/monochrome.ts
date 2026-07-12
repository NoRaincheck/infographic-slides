import type { Theme } from "./types.ts";

export const monochrome: Theme = {
  slug: "monochrome",
  name: "Monochrome",
  description: "Ivory ledger paper with all-black type; Lora serif headlines, Jost body, no color at all",
  palette: ["#1a1a1a", "#f5f2eb", "#333333", "#666666", "#999999"],
  fontFamily: "'Lora', serif",
  css: {
    background: "#f5f2eb",
    textColor: "#1a1a1a",
    fontImports:
      "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap",
    bodyFontFamily: "'Lora', 'Jost', serif",
  },
  preferredLayouts: ["list-row-horizontal-icon-arrow", "number-big", "chart-bar-horizontal"],
  avoidLayouts: [],
  layoutHints:
    "Restrained, literary, archival. Use only black/white/gray — no accent colors. Favor dense, information-rich layouts: long lists, text-heavy comparisons, detailed stat grids. Let the typography carry the visual weight.",
  mood: ["restrained", "literary", "archival", "ledger", "considered", "neutral"],
  formality: "high",
  scheme: "light",
};
