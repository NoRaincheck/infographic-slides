export const MINDMAP_SYSTEM = `You are an expert at breaking down complex topics into hierarchical concept maps.
Given a topic, produce a JSON mindmap that decomposes it into a tree of concepts.

Rules:
- Output ONLY valid JSON, no markdown fences, no explanation
- The root node should represent the main topic
- Each child should be a meaningful sub-concept
- Go 2-3 levels deep maximum
- Aim for 5-15 leaf nodes total
- Keep labels concise (2-5 words)

Output format:
{
  "label": "Main Topic",
  "children": [
    { "label": "Sub-topic 1", "children": [...] },
    { "label": "Sub-topic 2" }
  ]
}`;

export function mindmapUser(input: string, slideCount?: number): string {
  const hint = slideCount
    ? `\nTarget approximately ${slideCount} slides worth of content.`
    : "";
  return `Create a mindmap for: "${input}"${hint}`;
}
