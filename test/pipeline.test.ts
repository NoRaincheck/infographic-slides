import { afterEach, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runMindmap } from "../src/pipeline/mindmap.js";
import { runStory } from "../src/pipeline/story.js";
import { runSlideDesign } from "../src/pipeline/slide-design.js";
import { runIllustrations } from "../src/pipeline/illustration.js";
import { artifactPaths, type LLMOptions, type PipelineOptions } from "../src/utils/types.js";
import type { Theme } from "../src/themes/types.js";

function tmpDir(): string {
  return join(tmpdir(), `test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

function baseOpts(dir: string): PipelineOptions {
  return {
    input: "test topic",
    inputSource: "text",
    outputDir: dir,
    llmUrl: "http://localhost:1234",
    model: "test",
    illustrations: "auto",
    acceptAll: true,
    skip: [],
    regenerate: [],
    imageWidth: 1920,
    imageHeight: 1080,
    noEdit: true,
  };
}

const llmOpts: LLMOptions = { url: "http://localhost:1234", model: "test" };

describe("runMindmap", () => {
  let dir: string;

  beforeEach(() => {
    dir = tmpDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("produces minimal mindmap when skipped", async () => {
    const opts = { ...baseOpts(dir), skip: ["mindmap"] };
    const result = await runMindmap(opts, llmOpts);

    assert.equal(result.input, "test topic");
    assert.equal(result.tree.label, "test topic");
    assert.deepEqual(result.tree.children, []);

    // Should write artifact
    const paths = artifactPaths(dir);
    assert.ok(existsSync(paths.mindmap));
    const artifact = JSON.parse(readFileSync(paths.mindmap, "utf-8"));
    assert.equal(artifact.tree.label, "test topic");
  });

  it("reads cached artifact when it exists", async () => {
    const paths = artifactPaths(dir);
    mkdirSync(dir + "/artifacts", { recursive: true });
    const cached = {
      input: "cached topic",
      tree: { label: "Cached", children: [{ label: "Child" }] },
    };
    writeFileSync(paths.mindmap, JSON.stringify(cached));

    const opts = baseOpts(dir);
    const result = await runMindmap(opts, llmOpts);

    assert.equal(result.tree.label, "Cached");
    assert.equal(result.input, "cached topic");
  });

  it("ignores cache when regenerate includes mindmap", async () => {
    const paths = artifactPaths(dir);
    mkdirSync(dir + "/artifacts", { recursive: true });
    writeFileSync(paths.mindmap, JSON.stringify({ input: "old", tree: { label: "Old" } }));

    const opts = { ...baseOpts(dir), regenerate: ["mindmap"] };

    // Mock fetch to simulate LLM response so it doesn't hang
    const originalFetch = globalThis.fetch;
    const llmResponse = { tree: { label: "New", children: [] } };
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(llmResponse) } }],
      }),
    })) as typeof fetch;

    try {
      const result = await runMindmap(opts, llmOpts);
      // Should NOT have the cached "Old" — it called LLM and got "New"
      assert.equal(result.tree.label, "New");
      assert.equal(result.input, "test topic");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("runStory", () => {
  let dir: string;

  beforeEach(() => {
    dir = tmpDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("produces minimal story from mindmap when skipped", async () => {
    const opts = { ...baseOpts(dir), skip: ["story"], slides: 3 };
    const mindmap = {
      input: "topic",
      tree: {
        label: "Root",
        children: [
          { label: "A", children: [{ label: "A1" }, { label: "A2" }] },
          { label: "B" },
        ],
      },
    };

    const result = await runStory(opts, llmOpts, mindmap);

    assert.equal(result.storyTitle, "topic");
    assert.equal(result.targetSlides, 3);
    assert.equal(result.slides.length, 2);
    assert.equal(result.slides[0].title, "A");
    assert.equal(result.slides[0].keyPoints.length, 2);
    assert.equal(result.slides[1].title, "B");
    assert.equal(result.slides[1].keyPoints.length, 0);
  });

  it("reads cached artifact when it exists", async () => {
    const paths = artifactPaths(dir);
    mkdirSync(dir + "/artifacts", { recursive: true });
    const cached = {
      storyTitle: "Cached Story",
      targetSlides: 5,
      slides: [{ title: "S1", description: "d", keyPoints: ["k"] }],
    };
    writeFileSync(paths.story, JSON.stringify(cached));

    const mindmap = { input: "x", tree: { label: "X" } };
    const result = await runStory(baseOpts(dir), llmOpts, mindmap);

    assert.equal(result.storyTitle, "Cached Story");
    assert.equal(result.slides.length, 1);
  });

  it("uses default 5 slides when no count specified and skipped", async () => {
    const opts = { ...baseOpts(dir), skip: ["story"] };
    const mindmap = { input: "t", tree: { label: "T" } };

    const result = await runStory(opts, llmOpts, mindmap);
    assert.equal(result.targetSlides, 5);
  });
});

describe("runSlideDesign", () => {
  let dir: string;

  beforeEach(() => {
    dir = tmpDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("produces default slide designs when skipped", async () => {
    const opts = { ...baseOpts(dir), skip: ["slides"] };
    const story = {
      storyTitle: "Test",
      targetSlides: 2,
      slides: [
        { title: "Slide One", description: "First", keyPoints: ["a", "b", "c"] },
        { title: "Slide Two", description: "Second", keyPoints: ["x"] },
      ],
    };

    const result = await runSlideDesign(opts, llmOpts, story);

    assert.equal(result.length, 2);
    assert.equal(result[0].slideIndex, 0);
    assert.equal(result[0].title, "Slide One");
    assert.equal(result[0].template, "list-row-horizontal-icon-arrow");
    assert.ok(result[0].syntax.includes("Slide One"));
    assert.ok(result[0].syntax.includes("infographic list-row-horizontal-icon-arrow"));

    // Each key point should produce a label in the syntax
    assert.ok(result[0].syntax.includes("label a"));
    assert.ok(result[0].syntax.includes("label b"));
    assert.ok(result[0].syntax.includes("label c"));
  });

  it("reads cached artifact", async () => {
    const paths = artifactPaths(dir);
    mkdirSync(dir + "/artifacts", { recursive: true });
    const cached = [
      { slideIndex: 0, title: "Cached", template: "chart-bar-plain-text", syntax: "..." },
    ];
    writeFileSync(paths.slideDesign, JSON.stringify(cached));

    const story = { storyTitle: "T", targetSlides: 1, slides: [{ title: "X", description: "", keyPoints: [] }] };
    const result = await runSlideDesign(baseOpts(dir), llmOpts, story);

    assert.equal(result[0].template, "chart-bar-plain-text");
  });

  it("uses theme palette in skip fallback when theme is provided", async () => {
    const opts = { ...baseOpts(dir), skip: ["slides"] };
    const story = {
      storyTitle: "Test",
      targetSlides: 1,
      slides: [
        { title: "Slide One", description: "First", keyPoints: ["a"] },
      ],
    };
    const theme: Theme = {
      slug: "test",
      name: "Test",
      description: "Test theme",
      palette: ["#ff0000", "#00ff00", "#0000ff"],
      fontFamily: "sans-serif",
      css: { background: "#fff", textColor: "#000", fontImports: "", bodyFontFamily: "sans-serif" },
      preferredLayouts: [],
      avoidLayouts: [],
      layoutHints: "",
      mood: [],
      formality: "medium",
      scheme: "light",
    };

    const result = await runSlideDesign(opts, llmOpts, story, theme);

    assert.ok(result[0].syntax.includes("#ff0000 #00ff00 #0000ff"), "Should use theme palette in syntax");
    assert.ok(!result[0].syntax.includes("#3b82f6 #8b5cf6 #f97316"), "Should not use default palette");
  });

  it("falls back to default palette in skip fallback when no theme", async () => {
    const opts = { ...baseOpts(dir), skip: ["slides"] };
    const story = {
      storyTitle: "Test",
      targetSlides: 1,
      slides: [
        { title: "Slide One", description: "First", keyPoints: ["a"] },
      ],
    };

    const result = await runSlideDesign(opts, llmOpts, story);

    assert.ok(result[0].syntax.includes("#3b82f6 #8b5cf6 #f97316"), "Should use default palette");
  });
});

describe("runIllustrations", () => {
  let dir: string;

  beforeEach(() => {
    dir = tmpDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns null prompts when illustrations are off", async () => {
    const opts = { ...baseOpts(dir), illustrations: "off" as const };
    const slides = [
      { slideIndex: 0, title: "A", template: "list-*", syntax: "..." },
      { slideIndex: 1, title: "B", template: "chart-*", syntax: "..." },
    ];

    const result = await runIllustrations(opts, llmOpts, slides);

    assert.equal(result.length, 2);
    assert.equal(result[0].prompt, null);
    assert.equal(result[1].prompt, null);
  });

  it("returns null prompts when skipped", async () => {
    const opts = { ...baseOpts(dir), skip: ["illustrations"] };
    const slides = [
      { slideIndex: 0, title: "A", template: "list-*", syntax: "..." },
    ];

    const result = await runIllustrations(opts, llmOpts, slides);
    assert.equal(result[0].prompt, null);
  });

  it("reads cached artifact", async () => {
    const paths = artifactPaths(dir);
    mkdirSync(dir + "/artifacts", { recursive: true });
    const cached = [
      { slideIndex: 0, prompt: "A cat" },
      { slideIndex: 1, prompt: null },
    ];
    writeFileSync(paths.illustrations, JSON.stringify(cached));

    const slides = [
      { slideIndex: 0, title: "A", template: "list-*", syntax: "..." },
      { slideIndex: 1, title: "B", template: "chart-*", syntax: "..." },
    ];
    const result = await runIllustrations(baseOpts(dir), llmOpts, slides);

    assert.equal(result[0].prompt, "A cat");
    assert.equal(result[1].prompt, null);
  });
});
