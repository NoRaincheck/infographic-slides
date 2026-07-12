import type { MultimodalContent } from "../llm.ts";

export function illustrationVerifySystem(): string {
  return `You are a visual quality reviewer for infographic slides.
You will see a slide with an illustration composited onto it.

Evaluate the result on these criteria:
- Does the illustration blend naturally with the slide design?
- Is the composition balanced and visually appealing?
- Are there visual artifacts, misalignment, or clipping?
- Does the illustration style match the infographic aesthetic?
- Is the background removal clean (no leftover background edges)?

Output ONLY valid JSON, no markdown fences, no explanation.`;
}

export function illustrationVerifyUser(
  slideTitle: string,
  imageB64: string,
): MultimodalContent[] {
  return [
    {
      type: "text",
      text:
        `This is a composited infographic slide titled "${slideTitle}". An illustration has been overlaid on the rendered slide. Evaluate whether the result looks good.\n\nRespond with JSON:\n{ "ok": true/false, "issues": "description of issues if any" }`,
    },
    {
      type: "image_url",
      image_url: { url: `data:image/png;base64,${imageB64}` },
    },
  ];
}

export interface IllustrationVerdict {
  ok: boolean;
  issues?: string;
}
