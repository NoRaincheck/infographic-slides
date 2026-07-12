import type { Theme } from "./types.js";

export const emeraldEditorial: Theme = {
  slug: "emerald-editorial",
  name: "Emerald Editorial",
  description: "Magazine-cover business deck: emerald + navy + paper with double-rule masthead ornaments",
  palette: ["#0d6e4f", "#1a2744", "#f5f0e8", "#c9a96e", "#2c5282"],
  fontFamily: "'Playfair Display', serif",
  css: {
    background: "#f5f0e8",
    textColor: "#1a2744",
    fontImports: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Source+Sans+3:wght@300;400;500;600&display=swap",
    bodyFontFamily: "'Playfair Display', 'Source Sans 3', serif",
  },
  preferredLayouts: ["list-row-horizontal-icon-arrow", "number-big", "chart-bar-horizontal"],
  avoidLayouts: [],
  layoutHints:
    "Editorial, authoritative, considered. Favor magazine-style layouts with strong headlines and clear hierarchy. Use stat callouts with emerald/navy accent backgrounds. Process flows with numbered steps work well. Keep the overall feel like a serious publication.",
  mood: ["editorial", "considered", "confident", "magazine-cover", "authoritative"],
  formality: "medium-high",
  scheme: "mixed",
};
