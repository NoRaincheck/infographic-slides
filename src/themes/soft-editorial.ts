import type { Theme } from "./types.ts";

export const softEditorial: Theme = {
  slug: "soft-editorial",
  name: "Soft Editorial",
  description: "Cormorant Garamond serif on warm paper with sage, blush, and lemon accents",
  palette: ["#E1A4C2", "#D6DD63", "#E8C9B6", "#B7C7A8", "#C9BEDC"],
  fontFamily: "'Cormorant Garamond', serif",
  css: {
    background: "#F2EEDF",
    textColor: "#2A241B",
    fontImports:
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Work+Sans:wght@300;400;500;600&display=swap",
    bodyFontFamily: "'Cormorant Garamond', 'Work Sans', serif",
  },
  preferredLayouts: ["list-row-horizontal-icon-arrow", "number-big", "chart-bar-horizontal"],
  avoidLayouts: [],
  layoutHints:
    "Literary, elegant, unhurried. Favor editorial-style layouts with generous whitespace. Use stat grids with pastel accent backgrounds. Avoid cluttered or dense compositions — let each point breathe.",
  mood: ["literary", "elegant", "quiet", "warm-classical", "editorial", "considered"],
  formality: "high",
  scheme: "light",
};
