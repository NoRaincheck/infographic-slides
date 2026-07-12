import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getTheme, listThemes, getThemeSummaries, isValidThemeSlug } from "../src/themes/index.js";

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  return {
    r: parseInt(m[1].slice(0, 2), 16),
    g: parseInt(m[1].slice(2, 4), 16),
    b: parseInt(m[1].slice(4, 6), 16),
  };
}

function relativeLuminance(hex: string): number {
  const c = parseHex(hex);
  if (!c) return 0;
  const [rs, gs, bs] = [c.r / 255, c.g / 255, c.b / 255];
  const r = rs <= 0.03928 ? rs / 12.92 : ((rs + 0.055) / 1.055) ** 2.4;
  const g = gs <= 0.03928 ? gs / 12.92 : ((gs + 0.055) / 1.055) ** 2.4;
  const b = bs <= 0.03928 ? bs / 12.92 : ((bs + 0.055) / 1.055) ** 2.4;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

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

  it("dark themes have lighter text than background", () => {
    for (const theme of listThemes()) {
      if (theme.scheme === "dark") {
        const bgLum = relativeLuminance(theme.css.background);
        const textLum = relativeLuminance(theme.css.textColor);
        assert.ok(
          textLum > bgLum,
          `${theme.slug}: dark theme text (${theme.css.textColor}, lum=${textLum.toFixed(3)}) should be lighter than background (${theme.css.background}, lum=${bgLum.toFixed(3)})`,
        );
      }
    }
  });

  it("light themes have darker text than background", () => {
    for (const theme of listThemes()) {
      if (theme.scheme === "light") {
        const bgLum = relativeLuminance(theme.css.background);
        const textLum = relativeLuminance(theme.css.textColor);
        assert.ok(
          textLum < bgLum,
          `${theme.slug}: light theme text (${theme.css.textColor}, lum=${textLum.toFixed(3)}) should be darker than background (${theme.css.background}, lum=${bgLum.toFixed(3)})`,
        );
      }
    }
  });

  it("mixed themes have readable text contrast on their background", () => {
    for (const theme of listThemes()) {
      if (theme.scheme === "mixed") {
        const bgLum = relativeLuminance(theme.css.background);
        const textLum = relativeLuminance(theme.css.textColor);
        const ratio = (Math.max(bgLum, textLum) + 0.05) / (Math.min(bgLum, textLum) + 0.05);
        assert.ok(
          ratio >= 3,
          `${theme.slug}: mixed theme contrast ratio ${ratio.toFixed(1)} is too low (background ${theme.css.background}, text ${theme.css.textColor})`,
        );
      }
    }
  });

  it("all CSS colors are valid 6-digit hex", () => {
    for (const theme of listThemes()) {
      assert.ok(parseHex(theme.css.background), `${theme.slug}: invalid css.background ${theme.css.background}`);
      assert.ok(parseHex(theme.css.textColor), `${theme.slug}: invalid css.textColor ${theme.css.textColor}`);
    }
  });

  it("all palette colors are valid 6-digit hex", () => {
    for (const theme of listThemes()) {
      for (const color of theme.palette) {
        assert.ok(parseHex(color), `${theme.slug}: invalid palette color ${color}`);
      }
    }
  });

  it("dark themes have dark palette colors for backgrounds", () => {
    const velvet = getTheme("velvet-dark");
    const paletteLuminances = velvet.palette.map(relativeLuminance);
    const darkestPaletteColor = velvet.palette[paletteLuminances.indexOf(Math.min(...paletteLuminances))];
    assert.ok(
      relativeLuminance(darkestPaletteColor) < 0.2,
      `${velvet.slug}: darkest palette color ${darkestPaletteColor} should be dark enough for a dark theme background`,
    );
  });

  it("dark themes have light palette colors for text/highlights", () => {
    const velvet = getTheme("velvet-dark");
    const paletteLuminances = velvet.palette.map(relativeLuminance);
    const lightestPaletteColor = velvet.palette[paletteLuminances.indexOf(Math.max(...paletteLuminances))];
    assert.ok(
      relativeLuminance(lightestPaletteColor) > 0.4,
      `${velvet.slug}: lightest palette color ${lightestPaletteColor} should be light enough for text on dark backgrounds`,
    );
  });
});
