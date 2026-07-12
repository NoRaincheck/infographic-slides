import type { Theme } from "./types.js";

export const blueProfessional: Theme = {
  slug: "blue-professional",
  name: "Blue Professional",
  description: "Cream paper background with electric cobalt blue accents; clean modern professional",
  palette: ["#1e2bfa", "#fdfae7", "#111111", "#6b6b6b", "#9a9a9a"],
  fontFamily: "'Space Grotesk', sans-serif",
  css: {
    background: "#fdfae7",
    textColor: "#111111",
    fontImports: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap",
    bodyFontFamily: "'Space Grotesk', 'Inter', sans-serif",
  },
  preferredLayouts: ["list-row-horizontal-icon-arrow", "chart-bar-horizontal", "number-big"],
  avoidLayouts: [],
  layoutHints:
    "Clean, data-forward and polished. Favor metric grids, comparison tables, and structured list layouts. Use numbered lists and process flows. Keep compositions orderly and aligned.",
  mood: ["professional", "modern", "calm", "trustworthy", "considered"],
  formality: "medium-high",
  scheme: "light",
};
