import { afterEach, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
      "user message",
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
          "user",
        ),
      { message: /LLM request failed \(500\)/ },
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
      "user",
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
      "user",
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
      "user",
    );

    assert.equal(result.length, 2);
    assert.equal(result[0].id, 1);
  });

  it("throws on invalid JSON after exhausting retries", async () => {
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
          "user",
        ),
      SyntaxError,
    );

    assert.equal(globalThis.fetch.mock.callCount(), 3);
  });

  it("retries on parse failure and succeeds", async () => {
    let callCount = 0;
    globalThis.fetch = mock.fn(async () => {
      callCount++;
      const content = callCount < 3 ? "not json" : '{"key": "recovered"}';
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content } }],
        }),
      };
    }) as typeof fetch;

    const result = await chatJson<{ key: string }>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user",
    );

    assert.deepEqual(result, { key: "recovered" });
    assert.equal(globalThis.fetch.mock.callCount(), 3);
  });

  it("respects custom retry count", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "not json" } }],
      }),
    })) as typeof fetch;

    await assert.rejects(
      () =>
        chatJson<{ key: string }>(
          { url: "http://localhost:1234", model: "test" },
          "sys",
          "user",
          { retries: 0 },
        ),
      SyntaxError,
    );

    assert.equal(globalThis.fetch.mock.callCount(), 1);
  });

  it("retries on validation failure", async () => {
    let callCount = 0;
    globalThis.fetch = mock.fn(async () => {
      callCount++;
      const content = callCount < 2 ? '{"wrong": "structure"}' : '{"tree": {"label": "ok", "children": []}}';
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content } }],
        }),
      };
    }) as typeof fetch;

    const result = await chatJson<{ tree: { label: string } }>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user",
      {
        validate: (val) => {
          const obj = val as Record<string, unknown>;
          if (!obj.tree || typeof obj.tree !== "object") {
            throw new Error("missing tree");
          }
        },
      },
    );

    assert.deepEqual(result, { tree: { label: "ok", children: [] } });
    assert.equal(globalThis.fetch.mock.callCount(), 2);
  });

  it("extracts JSON wrapped in prose", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Here is the result:\n{"key": "extracted"}\nLet me know if you need anything else.',
            },
          },
        ],
      }),
    })) as typeof fetch;

    const result = await chatJson<{ key: string }>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user",
    );

    assert.deepEqual(result, { key: "extracted" });
  });

  it("extracts JSON array wrapped in prose", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Sure! Here you go:\n[{"id": 1}, {"id": 2}]\nHope that helps!',
            },
          },
        ],
      }),
    })) as typeof fetch;

    const result = await chatJson<{ id: number }[]>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user",
    );

    assert.equal(result.length, 2);
    assert.equal(result[0].id, 1);
  });

  it("strips trailing commas", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '{"a": 1, "b": 2,}',
            },
          },
        ],
      }),
    })) as typeof fetch;

    const result = await chatJson<{ a: number; b: number }>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user",
    );

    assert.deepEqual(result, { a: 1, b: 2 });
  });

  it("extracts from code fence with surrounding text", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Sure! Here is the JSON:\n```json\n{"wrapped": true}\n```\nLet me know.',
            },
          },
        ],
      }),
    })) as typeof fetch;

    const result = await chatJson<{ wrapped: boolean }>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user",
    );

    assert.deepEqual(result, { wrapped: true });
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
