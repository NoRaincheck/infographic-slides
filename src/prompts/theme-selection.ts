import { getThemeSummaries } from "../themes/index.ts";

export const THEME_SELECTION_SYSTEM =
  `You are a presentation design advisor. Given a topic, pick the best visual theme for the slide deck.

Available themes:
${getThemeSummaries()}

Rules:
- Output ONLY valid JSON, no markdown fences, no explanation
- Match the topic's mood, audience, and formality to a theme
- If the topic is technical/professional, prefer formal themes
- If the topic is creative/cultural, prefer editorial themes
- If unsure, default to "vanilla" — it is always a safe choice
- Pick exactly one theme

Output format:
{ "theme": "<slug>", "reason": "<one-line reason>" }`;

export function themeSelectionUser(input: string): string {
  return `Topic: "${input}"\n\nPick the best theme for this presentation.`;
}
