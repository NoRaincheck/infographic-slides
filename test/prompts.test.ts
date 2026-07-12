import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MINDMAP_SYSTEM, mindmapUser } from "../src/prompts/mindmap.js";
import { STORY_SYSTEM, storyUser } from "../src/prompts/story.js";
import { ILLUSTRATION_SYSTEM, illustrationUser } from "../src/prompts/illustration.js";
import { slideDesignSystem, slideDesignUser } from "../src/prompts/slide-design.js";
import type { SlideDesignArtifact } from "../src/utils/types.js";

describe("mindmap prompts", () => {
  it("MINDMAP_SYSTEM includes output format", () => {
    assert.ok(MINDMAP_SYSTEM.includes('"label"'));
    assert.ok(MINDMAP_SYSTEM.includes('"children"'));
  });

  it("mindmapUser includes the input topic", () => {
    const msg = mindmapUser("quantum computing");
    assert.ok(msg.includes("quantum computing"));
    assert.ok(msg.includes("Create a mindmap"));
  });

  it("mindmapUser includes slide count when provided", () => {
    const msg = mindmapUser("AI", 10);
    assert.ok(msg.includes("10"));
  });

  it("mindmapUser omits slide count hint when not provided", () => {
    const msg = mindmapUser("AI");
    assert.ok(!msg.includes("Target approximately"));
  });
});

describe("story prompts", () => {
  it("STORY_SYSTEM includes output format", () => {
    assert.ok(STORY_SYSTEM.includes('"storyTitle"'));
    assert.ok(STORY_SYSTEM.includes('"targetSlides"'));
    assert.ok(STORY_SYSTEM.includes('"slides"'));
  });

  it("storyUser includes the mindmap as JSON", () => {
    const tree = { label: "Root", children: [{ label: "Child" }] };
    const msg = storyUser(tree);
    assert.ok(msg.includes('"Root"'));
    assert.ok(msg.includes('"Child"'));
    assert.ok(msg.includes("Plan the story"));
  });

  it("storyUser includes slide count when provided", () => {
    const tree = { label: "Root" };
    const msg = storyUser(tree, 8);
    assert.ok(msg.includes("8"));
  });

  it("storyUser uses default hint when no slide count", () => {
    const tree = { label: "Root" };
    const msg = storyUser(tree);
    assert.ok(msg.includes("5-12"));
  });
});

describe("illustration prompts", () => {
  it("ILLUSTRATION_SYSTEM includes output format", () => {
    assert.ok(ILLUSTRATION_SYSTEM.includes('"slideIndex"'));
    assert.ok(ILLUSTRATION_SYSTEM.includes('"prompt"'));
  });

  it("illustrationUser serializes slide info", () => {
    const slides: SlideDesignArtifact[] = [
      { slideIndex: 0, title: "Intro", template: "list-row-*", syntax: "..." },
      { slideIndex: 1, title: "Data", template: "chart-line-*", syntax: "..." },
    ];
    const msg = illustrationUser(slides);
    assert.ok(msg.includes("Intro"));
    assert.ok(msg.includes("Data"));
    assert.ok(msg.includes("Decide which slides need illustrations"));
  });
});

describe("slide design prompts", () => {
  it("slideDesignSystem includes output format", () => {
    const sys = slideDesignSystem();
    assert.ok(sys.includes('"slideIndex"'));
    assert.ok(sys.includes('"template"'));
    assert.ok(sys.includes('"syntax"'));
  });

  it("slideDesignSystem includes AntV skill content", () => {
    const sys = slideDesignSystem();
    // The skill content should be injected
    assert.ok(sys.length > 500, "System prompt should be substantial with skill content");
  });

  it("slideDesignUser includes slides as JSON", () => {
    const slides = [
      { title: "Intro", description: "An intro", keyPoints: ["a", "b"] },
    ];
    const msg = slideDesignUser(slides);
    assert.ok(msg.includes("Intro"));
    assert.ok(msg.includes("Generate infographic syntax"));
  });
});
