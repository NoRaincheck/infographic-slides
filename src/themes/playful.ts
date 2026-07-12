import type { Theme } from "./types.js";

export const playful: Theme = {
  slug: "playful",
  name: "Playful",
  description: "Sun-warm peach background with Syne display: a friendly indie launch deck",
  palette: ["#ff9e6c", "#fff5eb", "#2d2d2d", "#ffd1a3", "#6ec6ca"],
  fontFamily: "'Syne', sans-serif",
  css: {
    background: "#fff5eb",
    textColor: "#2d2d2d",
    fontImports: "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap",
    bodyFontFamily: "'Syne', 'DM Sans', sans-serif",
  },
  preferredLayouts: ["list-row-horizontal-icon-arrow", "number-big", "chart-bar-horizontal"],
  avoidLayouts: [],
  layoutHints:
    "Warm, indie, approachable. Favor friendly list layouts with rounded corners and warm accent backgrounds. Use playful stat callouts and simple process flows. Keep the energy upbeat and welcoming — nothing stiff or corporate.",
  mood: ["warm", "approachable", "indie", "friendly", "playful", "upbeat"],
  formality: "low",
  scheme: "light",
};
