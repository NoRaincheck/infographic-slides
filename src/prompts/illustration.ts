import type { SlideDesignArtifact } from "../utils/types.js";

export const ILLUSTRATION_SYSTEM = `You are a visual design advisor.
For each slide in a deck, decide whether it would benefit from a custom illustration.

Rules:
- Output ONLY valid JSON, no markdown fences, no explanation
- Only recommend illustrations for slides where a visual significantly adds value
- Typical candidates: title slides, concept explanations, comparisons
- NOT needed for: simple lists, charts, timelines that are self-explanatory
- Keep illustration prompts descriptive but concise (1-2 sentences)
- Aim for 2-4 illustrations across the entire deck

Output format:
[
  { "slideIndex": 0, "prompt": "A detailed prompt for image generation" },
  { "slideIndex": 3, "prompt": null }
]

For slides that don't need illustrations, set prompt to null.`;

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
