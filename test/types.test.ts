import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { artifactPaths, STAGE_NAMES } from "../src/utils/types.js";

describe("artifactPaths", () => {
  it("returns correct paths for a given output dir", () => {
    const paths = artifactPaths("./output");
    assert.equal(paths.mindmap, "./output/artifacts/01-mindmap.json");
    assert.equal(paths.story, "./output/artifacts/02-story.json");
    assert.equal(paths.slideDesign, "./output/artifacts/03-slides.json");
    assert.equal(paths.illustrations, "./output/artifacts/04-illustrations.json");
    assert.equal(paths.rendered, "./output/artifacts/05-rendered.json");
  });

  it("handles absolute paths", () => {
    const paths = artifactPaths("/tmp/slides");
    assert.ok(paths.mindmap.startsWith("/tmp/slides/artifacts/"));
    assert.ok(paths.rendered.startsWith("/tmp/slides/artifacts/"));
  });

  it("all artifact paths end in .json", () => {
    const paths = artifactPaths("./out");
    for (const p of Object.values(paths)) {
      assert.ok(p.endsWith(".json"), `Expected ${p} to end in .json`);
    }
  });
});

describe("STAGE_NAMES", () => {
  it("contains all 6 stages", () => {
    assert.equal(STAGE_NAMES.length, 6);
  });

  it("includes expected stage names", () => {
    assert.ok(STAGE_NAMES.includes("mindmap"));
    assert.ok(STAGE_NAMES.includes("story"));
    assert.ok(STAGE_NAMES.includes("slides"));
    assert.ok(STAGE_NAMES.includes("illustrations"));
    assert.ok(STAGE_NAMES.includes("render"));
    assert.ok(STAGE_NAMES.includes("export"));
  });
});
