import type { Theme } from "./types.js";

export const neoGridBold: Theme = {
  slug: "neo-grid-bold",
  name: "Neo-Grid Bold",
  description: "Editorial neo-brutalism with a single neon yellow accent on off-white paper",
  palette: ["#d4ff00", "#f5f3ee", "#1a1a1a", "#333333", "#888888"],
  fontFamily: "'Space Grotesk', sans-serif",
  css: {
    background: "#f5f3ee",
    textColor: "#1a1a1a",
    fontImports: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
    bodyFontFamily: "'Space Grotesk', sans-serif",
  },
  preferredLayouts: ["list-row-horizontal-icon-arrow", "chart-bar-horizontal", "number-big"],
  avoidLayouts: [],
  layoutHints:
    "Confident, punchy, editorial-graphic. Favor bold stat grids, comparison tables, and process flows. Use large numbers and uppercase labels. The neon yellow accent should appear on key callouts and highlights. Keep compositions tight and high-density.",
  mood: ["confident", "punchy", "editorial", "modern", "graphic", "design-led"],
  formality: "medium",
  scheme: "light",
};
