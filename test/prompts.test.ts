import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MINDMAP_SYSTEM, mindmapUser } from "../src/prompts/mindmap.js";
import { STORY_SYSTEM, storyUser } from "../src/prompts/story.js";
import { ILLUSTRATION_SYSTEM, illustrationUser } from "../src/prompts/illustration.js";
import { slideDesignSystem, slideDesignUser } from "../src/prompts/slide-design.js";
import { THEME_SELECTION_SYSTEM, themeSelectionUser } from "../src/prompts/theme-selection.js";
import type { SlideDesignArtifact } from "../src/utils/types.js";
import type { Theme } from "../src/themes/types.js";

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

  it("mindmapUser uses file-aware prompt when inputSource is file", () => {
    const content = "# My Topic\n\n## Section 1\n- Point A\n- Point B";
    const msg = mindmapUser(content, undefined, "file");
    assert.ok(msg.includes("user's content"));
    assert.ok(msg.includes("respects the existing structure"));
    assert.ok(msg.includes("Section 1"));
  });

  it("mindmapUser falls back to inline prompt for text source", () => {
    const msg = mindmapUser("topic", undefined, "text");
    assert.ok(msg.includes('Create a mindmap for: "topic"'));
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

  it("storyUser includes raw content when inputSource is file", () => {
    const tree = { label: "Root" };
    const raw = "# My Presentation\n\n## Intro\nWelcome\n\n## Data\nResults here";
    const msg = storyUser(tree, 5, "file", raw);
    assert.ok(msg.includes("user provided structured content"));
    assert.ok(msg.includes("My Presentation"));
    assert.ok(msg.includes("respecting their structure"));
  });

  it("storyUser uses standard prompt for text source", () => {
    const tree = { label: "Root" };
    const msg = storyUser(tree, 5, "text");
    assert.ok(msg.includes("Here is the mindmap"));
    assert.ok(!msg.includes("structured content"));
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

  it("slideDesignSystem includes theme info when theme is provided", () => {
    const theme: Theme = {
      slug: "test-theme",
      name: "Test Theme",
      description: "A test theme",
      palette: ["#ff0000", "#00ff00"],
      fontFamily: "'Test Font', sans-serif",
      css: { background: "#fff", textColor: "#000", fontImports: "", bodyFontFamily: "sans-serif" },
      preferredLayouts: ["list-row-horizontal-icon-arrow"],
      avoidLayouts: ["chart-line-horizontal"],
      layoutHints: "Test layout hints",
      mood: ["test"],
      formality: "medium",
      scheme: "light",
    };
    const sys = slideDesignSystem(theme);
    assert.ok(sys.includes("Test Theme"));
    assert.ok(sys.includes("#ff0000 #00ff00"));
    assert.ok(sys.includes("'Test Font', sans-serif"));
    assert.ok(sys.includes("Test layout hints"));
    assert.ok(sys.includes("list-row-horizontal-icon-arrow"));
    assert.ok(sys.includes("chart-line-horizontal"));
  });

  it("slideDesignSystem omits theme block for vanilla", () => {
    const vanilla: Theme = {
      slug: "vanilla",
      name: "Vanilla",
      description: "Default",
      palette: ["#3b82f6"],
      fontFamily: "sans-serif",
      css: { background: "#fff", textColor: "#000", fontImports: "", bodyFontFamily: "sans-serif" },
      preferredLayouts: [],
      avoidLayouts: [],
      layoutHints: "",
      mood: [],
      formality: "medium",
      scheme: "light",
    };
    const sys = slideDesignSystem(vanilla);
    assert.ok(!sys.includes("THEME:"));
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

describe("theme selection prompts", () => {
  it("THEME_SELECTION_SYSTEM includes output format", () => {
    assert.ok(THEME_SELECTION_SYSTEM.includes('"theme"'));
    assert.ok(THEME_SELECTION_SYSTEM.includes('"reason"'));
  });

  it("THEME_SELECTION_SYSTEM includes available themes", () => {
    assert.ok(THEME_SELECTION_SYSTEM.includes("vanilla"));
    assert.ok(THEME_SELECTION_SYSTEM.includes("blue-professional"));
  });

  it("themeSelectionUser includes the input topic", () => {
    const msg = themeSelectionUser("quantum computing");
    assert.ok(msg.includes("quantum computing"));
    assert.ok(msg.includes("Pick the best theme"));
  });
});
