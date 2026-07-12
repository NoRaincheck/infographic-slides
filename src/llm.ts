import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function findProjectRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(dir, "skills"))) return dir;
    if (existsSync(resolve(dir, "package.json"))) return dir;
    dir = dirname(dir);
  }
  return resolve(__dirname, "../..");
}

const PROJECT_ROOT = findProjectRoot();

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  url: string;
  model: string;
}

function loadSkill(name: string): string {
  const skillPath = resolve(PROJECT_ROOT, "skills", name, "SKILL.md");
  try {
    return readFileSync(skillPath, "utf-8");
  } catch {
    return "";
  }
}

function loadSkillReference(
  skillName: string,
  refPath: string
): string {
  const fullPath = resolve(
    PROJECT_ROOT,
    "skills",
    skillName,
    "references",
    refPath
  );
  try {
    return readFileSync(fullPath, "utf-8");
  } catch {
    return "";
  }
}

export const SKILLS = {
  infographicCreator: () => loadSkill("infographic-creator"),
  infographicSyntaxCreator: () => loadSkill("infographic-syntax-creator"),
  infographicSyntaxPrompt: () =>
    loadSkillReference("infographic-syntax-creator", "prompt.md"),
};

export async function chat(
  opts: LLMOptions,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await fetch(`${opts.url}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  return data.choices[0].message.content;
}

export async function chatJson<T>(
  opts: LLMOptions,
  systemPrompt: string,
  userMessage: string
): Promise<T> {
  const raw = await chat(opts, systemPrompt, userMessage);
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : raw;
  return JSON.parse(jsonStr.trim()) as T;
}
