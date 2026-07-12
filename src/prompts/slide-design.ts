import type { StorySlide } from "../utils/types.ts";
import type { Theme } from "../themes/types.ts";
import { SKILLS } from "../llm.ts";

export function slideDesignSystem(theme?: Theme): string {
  const syntaxSkill = SKILLS.infographicSyntaxCreator();
  const syntaxRef = SKILLS.infographicSyntaxPrompt();

  const schemeHint = theme?.scheme === "dark"
    ? "Scheme: dark — use dark backgrounds with light/bright text throughout. All slide backgrounds must be dark."
    : theme?.scheme === "mixed"
    ? "Scheme: mixed — the outer background is light, but use dark accent blocks (from the palette) for key callouts and highlights. Alternate between light and dark blocks."
    : theme?.scheme === "light"
    ? "Scheme: light — use light/white backgrounds with dark text. Accent colors from the palette should appear on cards, callouts, and highlights."
    : "";

  const themeBlock = theme && theme.slug !== "vanilla"
    ? `\nTHEME: "${theme.name}" (${theme.description})
${schemeHint}
Use this palette for every slide's theme block: ${theme.palette.join(" ")}
Use this font-family in the theme block: ${theme.fontFamily}
${theme.layoutHints}
Preferred AntV templates: ${
      theme.preferredLayouts.length > 0 ? theme.preferredLayouts.join(", ") : "any appropriate template"
    }
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
- Include a palette in the theme block for each slide${
    theme ? ` using the theme colors: ${theme.palette.join(" ")}` : ""
  }
- Use a variety of template types across slides — do NOT reuse the same template for every slide. Pick the template that best fits each slide's content structure.

BODY TEXT RULES:
- bodyTop and bodyBottom are optional fields for slide body text (1-2 sentences each)
- Provide at most one of bodyTop or bodyBottom per slide — never both
- Prefer bodyTop or bodyBottom over putting long text in the AntV syntax \`desc\` field
- If you do include a \`desc\` field in the AntV syntax (at the \`  desc <text>\` level), keep it to 60 characters or fewer

Output format:
[
  {
    "slideIndex": 0,
    "title": "Slide Title",
    "bodyTop": "1-2 sentence description displayed at the top of the slide body",
    "template": "list-row-horizontal-icon-arrow",
    "syntax": "infographic list-row-horizontal-icon-arrow\\ndata\\n  title Slide Title\\n  desc Short desc here\\n  lists\\n    - label Item\\n      icon rocket\\ntheme\\n  palette #3b82f6 #8b5cf6 #f97316"
  }
]`;
}

export function slideDesignUser(slides: StorySlide[]): string {
  return `Generate infographic syntax for each slide:\n${JSON.stringify(slides, null, 2)}`;
}
