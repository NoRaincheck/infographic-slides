import type { Theme } from "./types.ts";

export const cobaltGrid: Theme = {
  slug: "cobalt-grid",
  name: "Cobalt Grid",
  description: "Electric cobalt italic serifs on a graph-paper canvas with slim hairline rules",
  palette: ["#2b5cff", "#faf8f3", "#1a1a2e", "#e8e4db", "#8899bb"],
  fontFamily: "'Instrument Serif', serif",
  css: {
    background: "#faf8f3",
    textColor: "#1a1a2e",
    fontImports:
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap",
    bodyFontFamily: "'Instrument Serif', 'DM Sans', serif",
  },
  preferredLayouts: ["list-row-horizontal-icon-arrow", "chart-bar-horizontal", "number-big"],
  avoidLayouts: [],
  layoutHints:
    "Studious, modernist, quietly editorial. Favor clean grid-based layouts with strong vertical alignment. Use horizontal rules and hairline separators. Stat grids and numbered lists fit well. Keep a research-bulletin calmness.",
  mood: ["editorial", "design-research", "studious", "modernist", "quietly-modern"],
  formality: "high",
  scheme: "light",
};
