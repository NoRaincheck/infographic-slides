import type { Theme } from "./types.ts";

export const velvetDark: Theme = {
  slug: "velvet-dark",
  name: "Velvet Dark",
  description: "Deep navy canvas with warm-yellow Cormorant serifs and a single dusty teal accent",
  palette: ["#f0d060", "#0f1b3d", "#d4c9a8", "#5ba3a3", "#1a2550"],
  fontFamily: "'Cormorant Garamond', serif",
  css: {
    background: "#0f1b3d",
    textColor: "#f0d060",
    fontImports:
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap",
    bodyFontFamily: "'Cormorant Garamond', 'Inter', serif",
  },
  preferredLayouts: ["list-row-horizontal-icon-arrow", "number-big", "chart-bar-horizontal"],
  avoidLayouts: [],
  layoutHints:
    "Scholarly, literary, quietly intelligent. Favor dark-background layouts with warm-yellow text and dusty teal accents. Stat callouts and editorial compositions work well. Keep the pace slow and contemplative — avoid dense information dumps.",
  mood: ["scholarly", "literary", "considered", "quiet", "intellectual", "dark"],
  formality: "high",
  scheme: "dark",
};
