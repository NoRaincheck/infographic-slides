import type { SlideDesignArtifact } from "../utils/types.js";
import type { Theme } from "../themes/types.js";

export function illustrationSystem(theme?: Theme): string {
  const themeContext = theme && theme.slug !== "vanilla"
    ? `\n\nTheme context:
- Theme name: ${theme.name}
- Color scheme: ${theme.scheme}
- Palette: ${theme.palette.join(", ")}
- Mood: ${theme.mood.join(", ")}
${theme.scheme === "dark" ? `- The slides use a dark background (${theme.css.background}) with light text (${theme.css.textColor}).
  Illustrations should have dark backgrounds or tones that blend with dark slides. Avoid bright white backgrounds.` : ""}
${theme.scheme === "light" ? `- The slides use a light background (${theme.css.background}) with dark text (${theme.css.textColor}).
  Illustrations should work well on light backgrounds. Avoid overly dark full-bleed images.` : ""}
${theme.scheme === "mixed" ? `- The slides mix light backgrounds (${theme.css.background}) with dark accent blocks.
  Illustrations can use either light or dark backgrounds, but should feel cohesive with the palette colors: ${theme.palette.join(", ")}.` : ""}`
    : "";

  return `You are a visual design advisor.
For each slide in a deck, decide whether it would benefit from a custom illustration.${themeContext}

Rules:
- Output ONLY valid JSON, no markdown fences, no explanation
- Only recommend illustrations for slides where a visual significantly adds value
- Typical candidates: title slides, concept explanations, comparisons
- NOT needed for: simple lists, charts, timelines that are self-explanatory
- Keep illustration prompts descriptive but concise (1-2 sentences)
- Aim for 2-4 illustrations across the entire deck
${theme && theme.slug !== "vanilla" ? `- Illustration prompts should produce images that visually match the "${theme.name}" theme's color palette and mood` : ""}

Output format:
[
  { "slideIndex": 0, "prompt": "A detailed prompt for image generation" },
  { "slideIndex": 3, "prompt": null }
]

For slides that don't need illustrations, set prompt to null.`;
}

export function illustrationUser(slides: SlideDesignArtifact[]): string {
  return `Here are the slides:\n${
    JSON.stringify(
      slides.map((s) => ({
        index: s.slideIndex,
        title: s.title,
        template: s.template,
      })),
      null,
      2,
    )
  }\n\nDecide which slides need illustrations.`;
}
