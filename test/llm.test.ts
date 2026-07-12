import { mock } from "node:test";
import assert from "node:assert/strict";
import { chat, chatJson, SKILLS } from "../src/llm.ts";

function mockFetch(fn: () => unknown): typeof fetch {
  return mock.fn(fn) as unknown as typeof fetch;
}

Deno.test("chat sends correct request and returns content", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      json: () => ({
        choices: [{ message: { content: "hello world" } }],
      }),
    }));

    const result = await chat(
      { url: "http://localhost:1234", model: "test" },
      "system prompt",
      "user message",
    );

    assert.equal(result, "hello world");
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof mock.fn>;
    assert.equal(fetchMock.mock.callCount(), 1);

    const args = fetchMock.mock.calls[0].arguments as [unknown, unknown];
    assert.equal(args[0], "http://localhost:1234/v1/chat/completions");
    const reqOpts = args[1] as { method: string; body: string };
    assert.equal(reqOpts.method, "POST");

    const body = JSON.parse(reqOpts.body);
    assert.equal(body.model, "test");
    assert.equal(body.messages.length, 2);
    assert.equal(body.messages[0].role, "system");
    assert.equal(body.messages[1].role, "user");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("chat throws on non-ok response", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = mockFetch(() => ({
      ok: false,
      status: 500,
      text: () => "server error",
    }));

    await assert.rejects(
      () =>
        chat(
          { url: "http://localhost:1234", model: "test" },
          "sys",
          "user",
        ),
      { message: /LLM request failed \(500\)/ },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("chatJson parses JSON from raw response", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      json: () => ({
        choices: [{ message: { content: '{"key": "value"}' } }],
      }),
    }));

    const result = await chatJson<{ key: string }>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user",
    );

    assert.deepEqual(result, { key: "value" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("chatJson parses JSON from markdown code fence", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const fenced = '```json\n{"key": "fenced"}\n```';
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      json: () => ({
        choices: [{ message: { content: fenced } }],
      }),
    }));

    const result = await chatJson<{ key: string }>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user",
    );

    assert.deepEqual(result, { key: "fenced" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("chatJson parses JSON array from response", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const arr = '[{"id": 1}, {"id": 2}]';
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      json: () => ({
        choices: [{ message: { content: arr } }],
      }),
    }));

    const result = await chatJson<{ id: number }[]>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user",
    );

    assert.equal(result.length, 2);
    assert.equal(result[0].id, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("chatJson throws on invalid JSON after exhausting retries", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      json: () => ({
        choices: [{ message: { content: "not json at all" } }],
      }),
    }));

    await assert.rejects(
      () =>
        chatJson<{ key: string }>(
          { url: "http://localhost:1234", model: "test" },
          "sys",
          "user",
        ),
      SyntaxError,
    );

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof mock.fn>;
    assert.equal(fetchMock.mock.callCount(), 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("chatJson retries on parse failure and succeeds", async () => {
  const originalFetch = globalThis.fetch;
  try {
    let callCount = 0;
    globalThis.fetch = mockFetch(() => {
      callCount++;
      const content = callCount < 3 ? "not json" : '{"key": "recovered"}';
      return {
        ok: true,
        json: () => ({
          choices: [{ message: { content } }],
        }),
      };
    });

    const result = await chatJson<{ key: string }>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user",
    );

    assert.deepEqual(result, { key: "recovered" });
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof mock.fn>;
    assert.equal(fetchMock.mock.callCount(), 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("chatJson respects custom retry count", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      json: () => ({
        choices: [{ message: { content: "not json" } }],
      }),
    }));

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

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof mock.fn>;
    assert.equal(fetchMock.mock.callCount(), 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("chatJson retries on validation failure", async () => {
  const originalFetch = globalThis.fetch;
  try {
    let callCount = 0;
    globalThis.fetch = mockFetch(() => {
      callCount++;
      const content = callCount < 2 ? '{"wrong": "structure"}' : '{"tree": {"label": "ok", "children": []}}';
      return {
        ok: true,
        json: () => ({
          choices: [{ message: { content } }],
        }),
      };
    });

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
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof mock.fn>;
    assert.equal(fetchMock.mock.callCount(), 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("chatJson extracts JSON wrapped in prose", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      json: () => ({
        choices: [
          {
            message: {
              content: 'Here is the result:\n{"key": "extracted"}\nLet me know if you need anything else.',
            },
          },
        ],
      }),
    }));

    const result = await chatJson<{ key: string }>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user",
    );

    assert.deepEqual(result, { key: "extracted" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("chatJson extracts JSON array wrapped in prose", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      json: () => ({
        choices: [
          {
            message: {
              content: 'Sure! Here you go:\n[{"id": 1}, {"id": 2}]\nHope that helps!',
            },
          },
        ],
      }),
    }));

    const result = await chatJson<{ id: number }[]>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user",
    );

    assert.equal(result.length, 2);
    assert.equal(result[0].id, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("chatJson strips trailing commas", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      json: () => ({
        choices: [
          {
            message: {
              content: '{"a": 1, "b": 2,}',
            },
          },
        ],
      }),
    }));

    const result = await chatJson<{ a: number; b: number }>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user",
    );

    assert.deepEqual(result, { a: 1, b: 2 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("chatJson extracts from code fence with surrounding text", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      json: () => ({
        choices: [
          {
            message: {
              content: 'Sure! Here is the JSON:\n```json\n{"wrapped": true}\n```\nLet me know.',
            },
          },
        ],
      }),
    }));

    const result = await chatJson<{ wrapped: boolean }>(
      { url: "http://localhost:1234", model: "test" },
      "sys",
      "user",
    );

    assert.deepEqual(result, { wrapped: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("SKILLS loads infographic-creator skill", () => {
  const content = SKILLS.infographicCreator();
  assert.ok(content.length > 0, "Should load non-empty content");
  assert.ok(content.includes("infographic"), "Should contain infographic text");
});

Deno.test("SKILLS loads infographic-syntax-creator skill", () => {
  const content = SKILLS.infographicSyntaxCreator();
  assert.ok(content.length > 0, "Should load non-empty content");
});

Deno.test("SKILLS loads syntax reference prompt", () => {
  const content = SKILLS.infographicSyntaxPrompt();
  assert.ok(content.length > 0, "Should load non-empty content");
});

Deno.test("SKILLS returns truthy for all skills", () => {
  assert.ok(SKILLS.infographicCreator());
  assert.ok(SKILLS.infographicSyntaxCreator());
  assert.ok(SKILLS.infographicSyntaxPrompt());
});
