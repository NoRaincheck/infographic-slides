import { registerFont } from "@antv/infographic";
import type { Theme } from "../themes/types.ts";

const registered = new Set<string>();

function parseGoogleFontsUrl(cssUrl: string): { family: string; weights: string[] }[] {
  const url = new URL(cssUrl);
  const familyParam = url.searchParams.get("family");
  if (!familyParam) return [];

  const families: { family: string; weights: string[] }[] = [];

  for (const part of familyParam.split("|")) {
    const colonIdx = part.indexOf(":");
    if (colonIdx === -1) {
      families.push({ family: decodeURIComponent(part.replace(/\+/g, " ")), weights: [] });
      continue;
    }

    const family = decodeURIComponent(part.slice(0, colonIdx).replace(/\+/g, " "));
    const spec = part.slice(colonIdx + 1);

    if (spec.startsWith("wght@")) {
      const weights = spec.slice(5).split(";").map((w) => w.trim()).filter(Boolean);
      families.push({ family, weights });
    } else if (spec.startsWith("ital,wght@")) {
      const pairs = spec.slice(10).split(";");
      const weightSet = new Set<string>();
      for (const pair of pairs) {
        const [, w] = pair.split(",");
        if (w) weightSet.add(w.trim());
      }
      families.push({ family, weights: Array.from(weightSet) });
    } else if (spec.startsWith("opsz,wght@")) {
      const pairs = spec.slice(10).split(";");
      const weightSet = new Set<string>();
      for (const pair of pairs) {
        const parts = pair.split(",");
        const w = parts[parts.length - 1];
        if (w) weightSet.add(w.trim());
      }
      families.push({ family, weights: Array.from(weightSet) });
    } else {
      families.push({ family, weights: [] });
    }
  }

  return families;
}

function buildGoogleFontsWeightUrl(family: string, weight: string): string {
  return `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&display=swap`;
}

export function registerThemeFonts(theme: Theme): void {
  if (!theme.css?.fontImports) return;

  const families = parseGoogleFontsUrl(theme.css.fontImports);
  for (const { family, weights } of families) {
    if (registered.has(family)) continue;

    const fontWeight: Record<string, string> = {};
    if (weights.length > 0) {
      for (const w of weights) {
        fontWeight[weightName(w)] = buildGoogleFontsWeightUrl(family, w);
      }
    } else {
      fontWeight.regular = buildGoogleFontsWeightUrl(family, "400");
    }

    registerFont({
      fontFamily: family,
      name: family,
      baseUrl: "",
      fontWeight,
    });

    registered.add(family);
  }
}

function weightName(w: string): string {
  const n = parseInt(w, 10);
  if (n <= 100) return "thin";
  if (n <= 200) return "extralight";
  if (n <= 300) return "light";
  if (n <= 400) return "regular";
  if (n <= 500) return "medium";
  if (n <= 600) return "semibold";
  if (n <= 700) return "bold";
  if (n <= 800) return "extrabold";
  if (n <= 900) return "black";
  return "extrablack";
}
