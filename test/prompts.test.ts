import assert from "node:assert/strict";
import { MINDMAP_SYSTEM, mindmapUser } from "../src/prompts/mindmap.ts";
import { STORY_SYSTEM, storyUser } from "../src/prompts/story.ts";
import { illustrationSystem, illustrationUser } from "../src/prompts/illustration.ts";
import { slideDesignSystem, slideDesignUser } from "../src/prompts/slide-design.ts";
import { THEME_SELECTION_SYSTEM, themeSelectionUser } from "../src/prompts/theme-selection.ts";
import type { SlideDesignArtifact } from "../src/utils/types.ts";
import type { Theme } from "../src/themes/types.ts";

Deno.test("mindmap prompts MINDMAP_SYSTEM includes output format", () => {
  assert.ok(MINDMAP_SYSTEM.includes('"label"'));
  assert.ok(MINDMAP_SYSTEM.includes('"children"'));
});

Deno.test("mindmap prompts mindmapUser includes the input topic", () => {
  const msg = mindmapUser("quantum computing");
  assert.ok(msg.includes("quantum computing"));
  assert.ok(msg.includes("Create a mindmap"));
});

Deno.test("mindmap prompts mindmapUser includes slide count when provided", () => {
  const msg = mindmapUser("AI", 10);
  assert.ok(msg.includes("10"));
});

Deno.test("mindmap prompts mindmapUser omits slide count hint when not provided", () => {
  const msg = mindmapUser("AI");
  assert.ok(!msg.includes("Target approximately"));
});

Deno.test("mindmap prompts mindmapUser uses file-aware prompt when inputSource is file", () => {
  const content = "# My Topic\n\n## Section 1\n- Point A\n- Point B";
  const msg = mindmapUser(content, undefined, "file");
  assert.ok(msg.includes("user's content"));
  assert.ok(msg.includes("respects the existing structure"));
  assert.ok(msg.includes("Section 1"));
});

Deno.test("mindmap prompts mindmapUser falls back to inline prompt for text source", () => {
  const msg = mindmapUser("topic", undefined, "text");
  assert.ok(msg.includes('Create a mindmap for: "topic"'));
});

Deno.test("story prompts STORY_SYSTEM includes output format", () => {
  assert.ok(STORY_SYSTEM.includes('"storyTitle"'));
  assert.ok(STORY_SYSTEM.includes('"targetSlides"'));
  assert.ok(STORY_SYSTEM.includes('"slides"'));
});

Deno.test("story prompts storyUser includes the mindmap as JSON", () => {
  const tree = { label: "Root", children: [{ label: "Child" }] };
  const msg = storyUser(tree);
  assert.ok(msg.includes('"Root"'));
  assert.ok(msg.includes('"Child"'));
  assert.ok(msg.includes("Plan the story"));
});

Deno.test("story prompts storyUser includes slide count when provided", () => {
  const tree = { label: "Root" };
  const msg = storyUser(tree, 8);
  assert.ok(msg.includes("8"));
});

Deno.test("story prompts storyUser uses default hint when no slide count", () => {
  const tree = { label: "Root" };
  const msg = storyUser(tree);
  assert.ok(msg.includes("5-12"));
});

Deno.test("story prompts storyUser includes raw content when inputSource is file", () => {
  const tree = { label: "Root" };
  const raw = "# My Presentation\n\n## Intro\nWelcome\n\n## Data\nResults here";
  const msg = storyUser(tree, 5, "file", raw);
  assert.ok(msg.includes("user provided structured content"));
  assert.ok(msg.includes("My Presentation"));
  assert.ok(msg.includes("respecting their structure"));
});

Deno.test("story prompts storyUser uses standard prompt for text source", () => {
  const tree = { label: "Root" };
  const msg = storyUser(tree, 5, "text");
  assert.ok(msg.includes("Here is the mindmap"));
  assert.ok(!msg.includes("structured content"));
});

Deno.test("illustration prompts illustrationSystem includes output format", () => {
  const sys = illustrationSystem();
  assert.ok(sys.includes('"slideIndex"'));
  assert.ok(sys.includes('"prompt"'));
});

Deno.test("illustration prompts illustrationSystem includes theme context for dark themes", () => {
  const darkTheme: Theme = {
    slug: "velvet-dark",
    name: "Velvet Dark",
    description: "Deep navy canvas",
    palette: ["#f0d060", "#0f1b3d"],
    fontFamily: "'Cormorant Garamond', serif",
    css: { background: "#0f1b3d", textColor: "#f0d060", fontImports: "", bodyFontFamily: "serif" },
    preferredLayouts: [],
    avoidLayouts: [],
    layoutHints: "",
    mood: ["dark"],
    formality: "high",
    scheme: "dark",
  };
  const sys = illustrationSystem(darkTheme);
  assert.ok(sys.includes("dark background"));
  assert.ok(sys.includes("dark"));
  assert.ok(sys.includes("Velvet Dark"));
  assert.ok(sys.includes("Avoid bright white backgrounds"));
});

Deno.test("illustration prompts illustrationSystem omits theme context for vanilla", () => {
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
  const sys = illustrationSystem(vanilla);
  assert.ok(!sys.includes("Theme context"));
});

Deno.test("illustration prompts illustrationUser serializes slide info", () => {
  const slides: SlideDesignArtifact[] = [
    { slideIndex: 0, title: "Intro", template: "list-row-*", syntax: "..." },
    { slideIndex: 1, title: "Data", template: "chart-line-*", syntax: "..." },
  ];
  const msg = illustrationUser(slides);
  assert.ok(msg.includes("Intro"));
  assert.ok(msg.includes("Data"));
  assert.ok(msg.includes("Decide which slides need illustrations"));
});

Deno.test("slide design prompts slideDesignSystem includes output format", () => {
  const sys = slideDesignSystem();
  assert.ok(sys.includes('"slideIndex"'));
  assert.ok(sys.includes('"template"'));
  assert.ok(sys.includes('"syntax"'));
});

Deno.test("slide design prompts slideDesignSystem includes AntV skill content", () => {
  const sys = slideDesignSystem();
  assert.ok(sys.length > 500, "System prompt should be substantial with skill content");
});

Deno.test("slide design prompts slideDesignSystem includes theme info when theme is provided", () => {
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
  assert.ok(sys.includes("Scheme: light"));
});

Deno.test("slide design prompts slideDesignSystem includes dark scheme guidance for dark themes", () => {
  const theme: Theme = {
    slug: "velvet-dark",
    name: "Velvet Dark",
    description: "Deep navy canvas",
    palette: ["#f0d060", "#0f1b3d"],
    fontFamily: "'Cormorant Garamond', serif",
    css: { background: "#0f1b3d", textColor: "#f0d060", fontImports: "", bodyFontFamily: "serif" },
    preferredLayouts: [],
    avoidLayouts: [],
    layoutHints: "",
    mood: ["dark"],
    formality: "high",
    scheme: "dark",
  };
  const sys = slideDesignSystem(theme);
  assert.ok(sys.includes("Scheme: dark"));
  assert.ok(sys.includes("dark backgrounds with light/bright text"));
});

Deno.test("slide design prompts slideDesignSystem omits theme block for vanilla", () => {
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

Deno.test("slide design prompts slideDesignUser includes slides as JSON", () => {
  const slides = [
    { title: "Intro", description: "An intro", keyPoints: ["a", "b"] },
  ];
  const msg = slideDesignUser(slides);
  assert.ok(msg.includes("Intro"));
  assert.ok(msg.includes("Generate infographic syntax"));
});

Deno.test("theme selection prompts THEME_SELECTION_SYSTEM includes output format", () => {
  assert.ok(THEME_SELECTION_SYSTEM.includes('"theme"'));
  assert.ok(THEME_SELECTION_SYSTEM.includes('"reason"'));
});

Deno.test("theme selection prompts THEME_SELECTION_SYSTEM includes available themes", () => {
  assert.ok(THEME_SELECTION_SYSTEM.includes("vanilla"));
  assert.ok(THEME_SELECTION_SYSTEM.includes("blue-professional"));
});

Deno.test("theme selection prompts themeSelectionUser includes the input topic", () => {
  const msg = themeSelectionUser("quantum computing");
  assert.ok(msg.includes("quantum computing"));
  assert.ok(msg.includes("Pick the best theme"));
});
