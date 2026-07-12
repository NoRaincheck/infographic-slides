import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getTheme, listThemes, getThemeSummaries, isValidThemeSlug } from "../src/themes/index.js";

describe("theme registry", () => {
  it("lists all themes", () => {
    const themes = listThemes();
    assert.ok(themes.length >= 11, `Expected at least 11 themes, got ${themes.length}`);
  });

  it("includes vanilla as the first theme", () => {
    const themes = listThemes();
    assert.equal(themes[0].slug, "vanilla");
  });

  it("getTheme returns the correct theme", () => {
    const theme = getTheme("blue-professional");
    assert.equal(theme.name, "Blue Professional");
    assert.ok(theme.palette.length > 0);
    assert.ok(theme.css.fontImports.includes("googleapis"));
  });

  it("getTheme throws for unknown slugs", () => {
    assert.throws(() => getTheme("nonexistent"), /Unknown theme/);
  });

  it("all themes have required fields", () => {
    for (const theme of listThemes()) {
      assert.ok(typeof theme.slug === "string", `${theme.slug}: missing slug`);
      assert.ok(typeof theme.name === "string", `${theme.slug}: missing name`);
      assert.ok(typeof theme.description === "string", `${theme.slug}: missing description`);
      assert.ok(Array.isArray(theme.palette), `${theme.slug}: missing palette`);
      assert.ok(theme.palette.length >= 2, `${theme.slug}: palette needs at least 2 colors`);
      assert.ok(typeof theme.fontFamily === "string", `${theme.slug}: missing fontFamily`);
      assert.ok(typeof theme.css === "object", `${theme.slug}: missing css`);
      assert.ok(typeof theme.css.background === "string", `${theme.slug}: missing css.background`);
      assert.ok(typeof theme.css.textColor === "string", `${theme.slug}: missing css.textColor`);
      assert.ok(typeof theme.css.fontImports === "string", `${theme.slug}: missing css.fontImports`);
      assert.ok(typeof theme.css.bodyFontFamily === "string", `${theme.slug}: missing css.bodyFontFamily`);
      assert.ok(Array.isArray(theme.preferredLayouts), `${theme.slug}: missing preferredLayouts`);
      assert.ok(Array.isArray(theme.avoidLayouts), `${theme.slug}: missing avoidLayouts`);
      assert.ok(typeof theme.layoutHints === "string", `${theme.slug}: missing layoutHints`);
      assert.ok(Array.isArray(theme.mood), `${theme.slug}: missing mood`);
      assert.ok(["low", "medium-low", "medium", "medium-high", "high"].includes(theme.formality), `${theme.slug}: invalid formality`);
      assert.ok(["light", "dark", "mixed"].includes(theme.scheme), `${theme.slug}: invalid scheme`);
    }
  });

  it("getThemeSummaries returns a string with all theme slugs", () => {
    const summaries = getThemeSummaries();
    assert.ok(summaries.includes("vanilla"));
    assert.ok(summaries.includes("blue-professional"));
    assert.ok(summaries.includes("soft-editorial"));
    assert.ok(summaries.includes("velvet-dark"));
    const themes = listThemes();
    for (const t of themes) {
      assert.ok(summaries.includes(t.slug), `Summary missing theme: ${t.slug}`);
    }
  });

  it("isValidThemeSlug returns true for known slugs", () => {
    assert.ok(isValidThemeSlug("vanilla"));
    assert.ok(isValidThemeSlug("monochrome"));
    assert.ok(isValidThemeSlug("playful"));
  });

  it("isValidThemeSlug returns false for unknown slugs", () => {
    assert.equal(isValidThemeSlug("nonexistent"), false);
  });

  it("vanilla theme has empty fontImports", () => {
    const vanilla = getTheme("vanilla");
    assert.equal(vanilla.css.fontImports, "");
  });

  it("dark themes have dark backgrounds", () => {
    const velvet = getTheme("velvet-dark");
    assert.equal(velvet.scheme, "dark");
    assert.ok(velvet.css.background.startsWith("#0"), "Dark theme should have a dark background");
  });
});
