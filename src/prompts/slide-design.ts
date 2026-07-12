import type { StorySlide } from "../utils/types.js";
import type { Theme } from "../themes/types.js";
import { SKILLS } from "../llm.js";

export function slideDesignSystem(theme?: Theme): string {
  const syntaxSkill = SKILLS.infographicSyntaxCreator();
  const syntaxRef = SKILLS.infographicSyntaxPrompt();

  const themeBlock =
    theme && theme.slug !== "vanilla"
      ? `\nTHEME: "${theme.name}" (${theme.description})
Use this palette for every slide's theme block: ${theme.palette.join(" ")}
Use this font-family in the theme block: ${theme.fontFamily}
${theme.layoutHints}
Preferred AntV templates: ${theme.preferredLayouts.length > 0 ? theme.preferredLayouts.join(", ") : "any appropriate template"}
Templates to avoid: ${theme.avoidLayouts.length > 0 ? theme.avoidLayouts.join(", ") : "none"}`
      : "";

  return `You are an expert at generating AntV Infographic syntax.
For each slide, choose the best template and produce valid infographic DSL.
${themeBlock}

${syntaxSkill}

${syntaxRef}

IMPORTANT RULES:
- Output ONLY valid JSON, no markdown fences, no explanation
- Each slide must have a valid template name from the available templates
- The syntax field must be complete, valid AntV Infographic syntax
- Preserve the user's language in all text fields
- Use semantic icon keywords (e.g. "rocket", "shield check", "chart line")
- Include a palette in the theme block for each slide${theme ? ` using the theme colors: ${theme.palette.join(" ")}` : ""}

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
