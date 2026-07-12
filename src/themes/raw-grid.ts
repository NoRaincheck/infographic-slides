import type { Theme } from "./types.js";

export const rawGrid: Theme = {
  slug: "raw-grid",
  name: "Raw Grid",
  description: "Neo-brutalist deck with thick borders, offset shadows, and a pink/sage/ink palette",
  palette: ["#e85d75", "#b7c7a8", "#1a1a2e", "#f5f0e8", "#333333"],
  fontFamily: "'Space Grotesk', sans-serif",
  css: {
    background: "#f5f0e8",
    textColor: "#1a1a2e",
    fontImports: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
    bodyFontFamily: "'Space Grotesk', sans-serif",
  },
  preferredLayouts: ["list-row-horizontal-icon-arrow", "chart-bar-horizontal", "number-big"],
  avoidLayouts: [],
  layoutHints:
    "Direct, graphic-confident, no-nonsense. Favor bold stat grids, comparison tables, and process flows. Use thick visual hierarchy and strong color blocking. The pink accent should appear on key callouts. Keep compositions high-density and scrappy-confident.",
  mood: ["raw", "punchy", "energetic", "confident", "graphic", "modern"],
  formality: "medium-low",
  scheme: "light",
};
