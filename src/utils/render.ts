import puppeteer from "puppeteer";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { renderToString } from "@antv/infographic/ssr";
import type { Theme } from "../themes/types.ts";
import { embedFonts } from "./fonts.ts";

export interface TextItem {
  x: number;
  y: number;
  width: number;
  height: number;
  html: string;
  spanStyle: string;
  horizontalAlign: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
}

export interface RenderOptions {
  syntax: string;
  outputPath: string;
  width: number;
  height: number;
  dpr?: number;
  theme?: Theme;
  htmlText?: boolean;
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
  textItems: TextItem[],
  svgViewBox: { x: number; y: number; w: number; h: number },
  viewportW: number,
  viewportH: number,
  embeddedFontCss: string,
  theme?: Theme,
): string {
  const bodyStyle = theme && theme.slug !== "vanilla"
    ? `background: ${theme.css.background}; font-family: ${theme.css.bodyFontFamily}; color: ${theme.css.textColor};`
    : "";

  const scaleX = viewportW / svgViewBox.w;
  const scaleY = viewportH / svgViewBox.h;

  const textElements = textItems
    .map((item) => {
      const left = (item.x - svgViewBox.x) * scaleX;
      const top = (item.y - svgViewBox.y) * scaleY;
      const w = item.width * scaleX;
      const h = item.height * scaleY;
      const justifyMap = { left: "flex-start", center: "center", right: "flex-end" };
      const alignMap = { top: "flex-start", middle: "center", bottom: "flex-end" };
      const textAlignMap = { left: "left", center: "center", right: "right" };
      const alignmentStyle = `justify-content:${justifyMap[item.horizontalAlign]};` +
        `align-items:${alignMap[item.verticalAlign]};` +
        `align-content:${alignMap[item.verticalAlign]};` +
        `text-align:${textAlignMap[item.horizontalAlign]};`;
      return `<div class="text-item" style="position:absolute;left:${left}px;top:${top}px;width:${w}px;height:${h}px;${alignmentStyle}">${item.html}</div>`;
    })
    .join("\n    ");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    ${embeddedFontCss}
    * { margin: 0; padding: 0; }
    body { width: ${viewportW}px; height: ${viewportH}px; overflow: hidden; position: relative; ${bodyStyle} }
    .svg-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .svg-container svg { width: ${viewportW}px !important; height: ${viewportH}px !important; display: block; }
    .text-item {
      overflow: hidden;
      display: flex;
      flex-wrap: wrap;
      word-break: break-word;
      white-space: pre-wrap;
    }
    .text-item span {
      width: 100%;
      height: 100%;
      display: flex;
      flex-wrap: wrap;
      word-break: break-word;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div class="svg-container">${svg}</div>
  ${textElements}
</body>
</html>`;
}

function parseViewBox(svg: string): { x: number; y: number; w: number; h: number } {
  const match = svg.match(/viewBox="([^"]*)"/);
  if (match) {
    const parts = match[1].trim().split(/\s+/).map(Number);
    if (parts.length === 4) {
      return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
    }
  }
  const wMatch = svg.match(/width="(\d+\.?\d*)"/);
  const hMatch = svg.match(/height="(\d+\.?\d*)"/);
  const w = wMatch ? Number.parseFloat(wMatch[1]) : 1920;
  const h = hMatch ? Number.parseFloat(hMatch[1]) : 1080;
  return { x: 0, y: 0, w, h };
}

async function extractTextItems(
  page: puppeteer.Page,
): Promise<{ textItems: TextItem[]; cleanedSvg: string }> {
  const result = await page.evaluate(
    () => {
      // deno-lint-ignore no-explicit-any
      const svgEl = (globalThis as any).document.querySelector("svg");
      if (!svgEl) return { textItems: [], cleanedSvg: "" };

      const textItems: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        html: string;
        spanStyle: string;
        horizontalAlign: string;
        verticalAlign: string;
      }> = [];

      const foreignObjects = svgEl.querySelectorAll("foreignObject");

      // deno-lint-ignore no-explicit-any
      foreignObjects.forEach((fo: any) => {
        const rect = fo.getBoundingClientRect();
        const svgRect = svgEl.getBoundingClientRect();

        const span = fo.querySelector("span");
        if (!span) return;

        const spanStyle = span.getAttribute("style") || "";
        const text = span.textContent || "";

        let horizontalAlign = "left";
        let verticalAlign = "top";

        const justifyMatch = spanStyle.match(/justify-content:\s*([^;]+);/);
        if (justifyMatch) {
          const v = justifyMatch[1].trim();
          if (v === "center") horizontalAlign = "center";
          else if (v === "flex-end") horizontalAlign = "right";
        }

        const alignContentMatch = spanStyle.match(/align-content:\s*([^;]+);/);
        if (alignContentMatch) {
          const v = alignContentMatch[1].trim();
          if (v === "center") verticalAlign = "middle";
          else if (v === "flex-end") verticalAlign = "bottom";
        }

        const cleanStyle = spanStyle
          .replace(/width:\s*100%;/g, "")
          .replace(/height:\s*100%;/g, "")
          .replace(/display:\s*flex;/g, "")
          .replace(/flex-wrap:\s*wrap;/g, "")
          .replace(/overflow:\s*visible;/g, "")
          .replace(/justify-content:\s*[^;]+;/g, "")
          .replace(/align-content:\s*[^;]+;/g, "")
          .replace(/align-items:\s*[^;]+;/g, "")
          .replace(/text-align:\s*[^;]+;/g, "");

        const scaleX = svgRect.width > 0 ? svgEl.viewBox.baseVal.width / svgRect.width : 1;
        const scaleY = svgRect.height > 0 ? svgEl.viewBox.baseVal.height / svgRect.height : 1;

        textItems.push({
          x: svgEl.viewBox.baseVal.x + (rect.left - svgRect.left) * scaleX,
          y: svgEl.viewBox.baseVal.y + (rect.top - svgRect.top) * scaleY,
          width: rect.width * scaleX,
          height: rect.height * scaleY,
          html: `<span style="${cleanStyle}">${text}</span>`,
          spanStyle: cleanStyle,
          horizontalAlign,
          verticalAlign,
        });

        fo.remove();
      });

      // deno-lint-ignore no-explicit-any
      const cleanedSvg = new (globalThis as any).XMLSerializer().serializeToString(svgEl);

      return { textItems, cleanedSvg };
    },
  );

  return result as { textItems: TextItem[]; cleanedSvg: string };
}

export async function renderSyntaxToPng(
  opts: RenderOptions,
): Promise<{ pngPath: string; svgPath: string }> {
  const { syntax, outputPath, width, height, dpr = 2, theme, htmlText } = opts;

  mkdirSync(dirname(outputPath), { recursive: true });

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
      const initHtml = buildHtml(svg, width, height, "", theme);
      await page.setContent(initHtml, { waitUntil: "domcontentloaded" });
      await new Promise((r) => setTimeout(r, 100));

      const { textItems, cleanedSvg } = await extractTextItems(page);

      const viewBox = parseViewBox(cleanedSvg);
      const finalHtml = buildHtmlTextOverlay(
        cleanedSvg,
        textItems,
        viewBox,
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

    await page.screenshot({ path: pngPath, fullPage: false });

    return { pngPath, svgPath };
  } finally {
    await browser.close();
  }
}
