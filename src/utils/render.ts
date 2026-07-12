import puppeteer from "puppeteer";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { renderToString } from "@antv/infographic/ssr";

export interface RenderOptions {
  syntax: string;
  outputPath: string;
  width: number;
  height: number;
  dpr?: number;
}

const HTML_TEMPLATE = (svg: string, w: number, h: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; }
    body { width: ${w}px; height: ${h}px; overflow: hidden; }
    svg { width: ${w}px; height: ${h}px; }
  </style>
</head>
<body>${svg}</body>
</html>`;

export async function renderSyntaxToPng(
  opts: RenderOptions,
): Promise<{ pngPath: string; svgPath: string }> {
  const { syntax, outputPath, width, height, dpr = 2 } = opts;

  mkdirSync(dirname(outputPath), { recursive: true });

  const svg = await renderToString(syntax, { width, height });

  const pngPath = outputPath.endsWith(".png") ? outputPath : `${outputPath}.png`;
  const svgPath = pngPath.replace(/\.png$/, ".svg");

  writeFileSync(svgPath, svg);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: dpr });

    const html = HTML_TEMPLATE(svg, width, height);
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    await page.screenshot({ path: pngPath, fullPage: false });

    return { pngPath, svgPath };
  } finally {
    await browser.close();
  }
}
