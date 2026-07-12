import type { Theme } from "./types.ts";

export const vanilla: Theme = {
  slug: "vanilla",
  name: "Vanilla",
  description: "Default clean style with blue/purple/orange palette — no specific theme styling",
  palette: ["#3b82f6", "#8b5cf6", "#f97316"],
  fontFamily: "sans-serif",
  css: {
    background: "#ffffff",
    textColor: "#111111",
    fontImports: "",
    bodyFontFamily: "sans-serif",
  },
  preferredLayouts: [],
  avoidLayouts: [],
  layoutHints: "No theme constraints. Choose the best AntV Infographic template for each slide's content.",
  mood: [],
  formality: "medium",
  scheme: "light",
};
