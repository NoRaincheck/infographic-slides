import puppeteer from "puppeteer";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { renderToString } from "@antv/infographic/ssr";
import type { Theme } from "../themes/types.ts";
import { embedFonts } from "./fonts.ts";
import { registerThemeFonts } from "./font-registration.ts";

export interface SyntaxTextContent {
  title: string;
  desc: string;
  bodyTop?: string;
  bodyBottom?: string;
  items: { label: string; desc: string; value: string }[];
}

export interface RenderOptions {
  syntax: string;
  outputPath: string;
  width: number;
  height: number;
  dpr?: number;
  theme?: Theme;
  htmlText?: boolean;
  bodyTop?: string;
  bodyBottom?: string;
}

export function parseSyntaxText(syntax: string): SyntaxTextContent {
  const lines = syntax.split("\n");
  let title = "";
  let desc = "";
  const items: { label: string; desc: string; value: string }[] = [];
  let currentItem: { label: string; desc: string; value: string } | null = null;

  for (const line of lines) {
    const titleMatch = line.match(/^\s{2}title\s+(.+)$/);
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }

    const descMatch = line.match(/^(\s{2})desc\s+(.+)$/);
    if (descMatch && descMatch[1].length === 2) {
      desc = descMatch[2].trim();
      continue;
    }

    const itemLabelMatch = line.match(/^\s+-\s+label\s+(.+)$/);
    if (itemLabelMatch) {
      if (currentItem) items.push(currentItem);
      currentItem = { label: itemLabelMatch[1].trim(), desc: "", value: "" };
      continue;
    }

    if (currentItem) {
      const itemDescMatch = line.match(/^\s+desc\s+(.+)$/);
      if (itemDescMatch) {
        currentItem.desc = itemDescMatch[1].trim();
        continue;
      }
      const itemValueMatch = line.match(/^\s+value\s+(.+)$/);
      if (itemValueMatch) {
        currentItem.value = itemValueMatch[1].trim();
        continue;
      }
    }
  }
  if (currentItem) items.push(currentItem);

  return { title, desc, items };
}

function buildHtml(
  svg: string,
  w: number,
  h: number,
  embeddedFontCss: string,
  theme?: Theme,
): string {
  const bodyStyle = theme && theme.slug !== "vanilla"
    ? `background: ${theme.css.background}; font-family: ${theme.css.bodyFontFamily}; color: ${theme.css.textColor};`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    ${embeddedFontCss}
    * { margin: 0; padding: 0; }
    body { width: ${w}px; height: ${h}px; overflow: hidden; ${bodyStyle} }
    svg { width: ${w}px !important; height: ${h}px !important; display: block; }
  </style>
</head>
<body>${svg}</body>
</html>`;
}

function buildHtmlTextOverlay(
  svg: string,
  text: SyntaxTextContent,
  viewportW: number,
  viewportH: number,
  embeddedFontCss: string,
  theme?: Theme,
): string {
  const bodyStyle = theme && theme.slug !== "vanilla"
    ? `background: ${theme.css.background}; font-family: ${theme.css.bodyFontFamily}; color: ${theme.css.textColor};`
    : "";

  const headerHtml = text.title
    ? `<div class="header">${text.title}</div>`
    : "";

  const bodyTopHtml = text.bodyTop
    ? `<div class="body-top">${text.bodyTop}</div>`
    : "";

  const descHtml = text.desc
    ? `<div class="desc">${text.desc}</div>`
    : "";

  const itemsHtml = text.items.length > 0
    ? `<div class="body-items">${text.items.map((item) => {
      const parts: string[] = [];
      if (item.label) parts.push(`<span class="item-label">${item.label}</span>`);
      if (item.value) parts.push(`<span class="item-value">${item.value}</span>`);
      if (item.desc) parts.push(`<span class="item-desc">${item.desc}</span>`);
      return `<div class="body-item">${parts.join(" ")}</div>`;
    }).join("\n    ")}</div>`
    : "";

  const bodyBottomHtml = text.bodyBottom
    ? `<div class="body-bottom">${text.bodyBottom}</div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    ${embeddedFontCss}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: ${viewportW}px; height: ${viewportH}px; overflow: hidden; position: relative; ${bodyStyle} }
    .svg-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
    .svg-container svg { width: ${viewportW}px !important; height: ${viewportH}px !important; display: block; }
    .header {
      position: relative;
      z-index: 1;
      padding: 24px 32px 8px;
      font-size: 28px;
      font-weight: 700;
      line-height: 1.2;
      word-break: break-word;
    }
    .body-top {
      position: relative;
      z-index: 1;
      padding: 8px 32px 12px;
      font-size: 16px;
      font-weight: 400;
      line-height: 1.4;
      opacity: 0.85;
      word-break: break-word;
    }
    .body-bottom {
      position: relative;
      z-index: 1;
      padding: 12px 32px 8px;
      font-size: 16px;
      font-weight: 400;
      line-height: 1.4;
      opacity: 0.85;
      word-break: break-word;
    }
    .desc {
      position: relative;
      z-index: 1;
      padding: 0 32px 12px;
      font-size: 16px;
      font-weight: 400;
      line-height: 1.4;
      opacity: 0.85;
      word-break: break-word;
    }
    .body-items {
      position: relative;
      z-index: 1;
      padding: 0 32px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .body-item {
      font-size: 15px;
      line-height: 1.4;
      word-break: break-word;
    }
    .item-label { font-weight: 600; }
    .item-value { font-weight: 700; opacity: 0.9; }
    .item-desc { opacity: 0.75; }
  </style>
</head>
<body>
  <div class="svg-container">${svg}</div>
  ${headerHtml}
  ${bodyTopHtml}
  ${descHtml}
  ${itemsHtml}
  ${bodyBottomHtml}
</body>
</html>`;
}

function stripForeignObjects(svg: string): string {
  return svg.replace(/<foreignObject[^>]*>[\s\S]*?<\/foreignObject>/g, "");
}

export async function renderSyntaxToPng(
  opts: RenderOptions,
): Promise<{ pngPath: string; svgPath: string }> {
  const { syntax, outputPath, width, height, dpr = 2, theme, htmlText } = opts;

  mkdirSync(dirname(outputPath), { recursive: true });

  if (theme) registerThemeFonts(theme);

  const svg = await renderToString(syntax, {
    width,
    height,
    svg: {
      attributes: {
        preserveAspectRatio: "xMidYMid meet",
      },
    },
  });

  const pngPath = outputPath.endsWith(".png") ? outputPath : `${outputPath}.png`;
  const svgPath = pngPath.replace(/\.png$/, ".svg");

  let embeddedFontCss = "";
  if (theme?.css?.fontImports) {
    embeddedFontCss = await embedFonts(theme.css.fontImports);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: dpr });

    if (htmlText) {
      const text: SyntaxTextContent = {
        ...parseSyntaxText(syntax),
        bodyTop: opts.bodyTop,
        bodyBottom: opts.bodyBottom,
      };
      const cleanedSvg = stripForeignObjects(svg);
      const finalHtml = buildHtmlTextOverlay(
        cleanedSvg,
        text,
        width,
        height,
        embeddedFontCss,
        theme,
      );

      writeFileSync(svgPath, cleanedSvg);
      await page.setContent(finalHtml, { waitUntil: "domcontentloaded" });
    } else {
      const html = buildHtml(svg, width, height, embeddedFontCss, theme);
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      writeFileSync(svgPath, svg);
    }

    await page.evaluate(() => (globalThis as any).document.fonts?.ready);
    await page.screenshot({ path: pngPath, fullPage: false });

    return { pngPath, svgPath };
  } finally {
    await browser.close();
  }
}
