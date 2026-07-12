import type { MindmapNode } from "../utils/types.js";

export const STORY_SYSTEM = `You are an expert presentation designer.
Given a mindmap of concepts, plan a coherent slide deck that tells a compelling story.

Rules:
- Output ONLY valid JSON, no markdown fences, no explanation
- Each slide should flow logically to the next
- Start with an introduction/overview, end with a summary/conclusion
- Include a mix of slide types (lists, comparisons, sequences, charts where data fits)
- Keep titles short (3-8 words)
- Descriptions should be 1-2 sentences
- keyPoints should be 3-6 items per slide

Output format:
{
  "storyTitle": "Deck Title",
  "targetSlides": 8,
  "slides": [
    {
      "title": "Slide Title",
      "description": "Brief description of what this slide covers",
      "keyPoints": ["point 1", "point 2", "point 3"]
    }
  ]
}`;

export function storyUser(
  tree: MindmapNode,
  slideCount?: number,
  inputSource?: "text" | "file",
  rawInput?: string,
): string {
  const hint = slideCount
    ? `The user wants approximately ${slideCount} slides.`
    : "Choose an appropriate number of slides (5-12).";
  let msg = `Here is the mindmap:\n${JSON.stringify(tree, null, 2)}\n\n${hint}\nPlan the story.`;
  if (inputSource === "file" && rawInput) {
    msg =
      `The user provided structured content for this presentation. Use it as the primary source, respecting their structure and instructions where they exist.

Original content:
${rawInput}

Mindmap extracted from the content:
${JSON.stringify(tree, null, 2)}

${hint}
Plan the story, staying faithful to the user's content and structure.`;
  }
  return msg;
}
