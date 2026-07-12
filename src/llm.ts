import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";

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
  refPath: string,
): string {
  const fullPath = resolve(
    PROJECT_ROOT,
    "skills",
    skillName,
    "references",
    refPath,
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
  infographicSyntaxPrompt: () => loadSkillReference("infographic-syntax-creator", "prompt.md"),
};

export async function chat(
  opts: LLMOptions,
  systemPrompt: string,
  userMessage: string,
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

export interface ChatJsonOptions {
  retries?: number;
  validate?: (value: unknown) => void;
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const trimmed = raw.trim();
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // continue to heuristic extraction
  }

  const candidates: string[] = [];

  const startBrace = trimmed.indexOf("{");
  const startBracket = trimmed.indexOf("[");
  let start = -1;
  if (startBrace === -1) start = startBracket;
  else if (startBracket === -1) start = startBrace;
  else start = Math.min(startBrace, startBracket);

  if (start !== -1) {
    const open = trimmed[start];
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "{" || ch === "[") depth++;
      if (ch === "}" || ch === "]") depth--;
      if (depth === 0 && i > start) {
        candidates.push(trimmed.slice(start, i + 1));
        break;
      }
    }
  }

  const stripped = raw.replace(/,\s*([\]}])/g, "$1");
  if (stripped !== raw) {
    const strippedFenced = stripped.match(/```json\s*([\s\S]*?)```/);
    if (strippedFenced) candidates.push(strippedFenced[1].trim());
    const strippedTrimmed = stripped.trim();
    if (strippedTrimmed !== trimmed) candidates.push(strippedTrimmed);
  }

  for (const candidate of candidates) {
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  return trimmed;
}

export async function chatJson<T>(
  opts: LLMOptions,
  systemPrompt: string,
  userMessage: string,
  jsonOpts?: ChatJsonOptions,
): Promise<T> {
  const maxAttempts = 1 + (jsonOpts?.retries ?? 2);
  const validate = jsonOpts?.validate;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const raw = await chat(opts, systemPrompt, userMessage);
    const jsonStr = extractJson(raw);
    try {
      const parsed = JSON.parse(jsonStr) as T;
      if (validate) {
        validate(parsed);
      }
      return parsed;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        console.log(
          chalk.yellow(
            `  Attempt ${attempt}/${maxAttempts} failed, retrying... (${(err as Error).message})`,
          ),
        );
      }
    }
  }
  throw lastError;
}
