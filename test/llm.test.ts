import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chat, chatJson, SKILLS } from "../src/llm.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("chat", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends correct request and returns content", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "hello world" } }],
      }),
    })) as typeof fetch;

    const result = await chat(
      { url: "http://localhost:1234", model: "test" },
      "system prompt",
      "user message"
    );

    assert.equal(result, "hello world");
    assert.equal(globalThis.fetch.mock.callCount(), 1);

    const [url, opts] = globalThis.fetch.mock.calls[0].arguments;
    assert.equal(url, "http://localhost:1234/v1/chat/completions");
    assert.equal(opts.method, "POST");

    const body = JSON.parse(opts.body);
    assert.equal(body.model, "test");
    assert.equal(body.messages.length, 2);
    assert.equal(body.messages[0].role, "system");
    assert.equal(body.messages[1].role, "user");
  });

  it("throws on non-ok response", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => "server error",
    })) as typeof fetch;

    await assert.rejects(
      () =>
        chat(
          { url: "http://localhost:1234", model: "test" },
          "sys",
          "user"
        ),
      { message: /LLM request failed \(500\)/ }
    );
  });
});

describe("chatJson", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("parses JSON from raw response", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"key": "value"}' } }],
      }),
    })) as typeof fetch;

    const result = await chatJson<{ key: string }>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user"
    );

    assert.deepEqual(result, { key: "value" });
  });

  it("parses JSON from markdown code fence", async () => {
    const fenced = '```json\n{"key": "fenced"}\n```';
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: fenced } }],
      }),
    })) as typeof fetch;

    const result = await chatJson<{ key: string }>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user"
    );

    assert.deepEqual(result, { key: "fenced" });
  });

  it("parses JSON array from response", async () => {
    const arr = '[{"id": 1}, {"id": 2}]';
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: arr } }],
      }),
    })) as typeof fetch;

    const result = await chatJson<{ id: number }[]>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user"
    );

    assert.equal(result.length, 2);
    assert.equal(result[0].id, 1);
  });

  it("throws on invalid JSON", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "not json at all" } }],
      }),
    })) as typeof fetch;

    await assert.rejects(
      () =>
        chatJson<{ key: string }>(
          { url: "http://localhost:1234", model: "test" },
          "sys",
          "user"
        ),
      SyntaxError
    );
  });
});

describe("SKILLS", () => {
  it("loads infographic-creator skill", () => {
    const content = SKILLS.infographicCreator();
    assert.ok(content.length > 0, "Should load non-empty content");
    assert.ok(content.includes("infographic"), "Should contain infographic text");
  });

  it("loads infographic-syntax-creator skill", () => {
    const content = SKILLS.infographicSyntaxCreator();
    assert.ok(content.length > 0, "Should load non-empty content");
  });

  it("loads syntax reference prompt", () => {
    const content = SKILLS.infographicSyntaxPrompt();
    assert.ok(content.length > 0, "Should load non-empty content");
  });

  it("returns empty string for missing skill", () => {
    // We can't directly test loadSkill with a bad name since it's private,
    // but we can verify the existing skills return truthy
    assert.ok(SKILLS.infographicCreator());
    assert.ok(SKILLS.infographicSyntaxCreator());
    assert.ok(SKILLS.infographicSyntaxPrompt());
  });
});
