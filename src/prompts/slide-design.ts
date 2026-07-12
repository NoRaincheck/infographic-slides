import type { StorySlide } from "../utils/types.js";
import { SKILLS } from "../llm.js";

export function slideDesignSystem(): string {
  const syntaxSkill = SKILLS.infographicSyntaxCreator();
  const syntaxRef = SKILLS.infographicSyntaxPrompt();
  return `You are an expert at generating AntV Infographic syntax.
For each slide, choose the best template and produce valid infographic DSL.

${syntaxSkill}

${syntaxRef}

IMPORTANT RULES:
- Output ONLY valid JSON, no markdown fences, no explanation
- Each slide must have a valid template name from the available templates
- The syntax field must be complete, valid AntV Infographic syntax
- Preserve the user's language in all text fields
- Use semantic icon keywords (e.g. "rocket", "shield check", "chart line")
- Include a palette in the theme block for each slide

Output format:
[
  {
    "slideIndex": 0,
    "title": "Slide Title",
    "template": "list-row-horizontal-icon-arrow",
    "syntax": "infographic list-row-horizontal-icon-arrow\\ndata\\n  title Slide Title\\n  lists\\n    - label Item\\n      icon rocket\\ntheme\\n  palette #3b82f6 #8b5cf6 #f97316"
  }
]`;
}

export function slideDesignUser(slides: StorySlide[]): string {
  return `Generate infographic syntax for each slide:\n${JSON.stringify(slides, null, 2)}`;
}
