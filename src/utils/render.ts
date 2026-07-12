import puppeteer from "puppeteer";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface RenderOptions {
  syntax: string;
  outputPath: string;
  width: number;
  height: number;
  dpr?: number;
}

const HTML_TEMPLATE = (syntax: string, w: number, h: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; }
    body { width: ${w}px; height: ${h}px; overflow: hidden; }
    #container { width: ${w}px; height: ${h}px; }
  </style>
</head>
<body>
  <div id="container"></div>
  <script src="https://unpkg.com/@antv/infographic@latest/dist/infographic.min.js"></script>
  <script>
    const infographic = new AntVInfographic.Infographic({
      container: '#container',
      width: ${w},
      height: ${h},
    });
    infographic.render(\`${syntax.replace(/`/g, "\\`")}\`);
  </script>
</body>
</html>`;

export async function renderSyntaxToPng(
  opts: RenderOptions
): Promise<{ pngPath: string; svgPath: string }> {
  const { syntax, outputPath, width, height, dpr = 2 } = opts;

  mkdirSync(dirname(outputPath), { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: dpr });

    const html = HTML_TEMPLATE(syntax, width, height);
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30_000 });

    // Wait for SVG to render
    await page.waitForSelector("svg", { timeout: 15_000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));

    const pngPath = outputPath.endsWith(".png")
      ? outputPath
      : `${outputPath}.png`;
    const svgPath = pngPath.replace(/\.png$/, ".svg");

    // Export SVG
    const svgData = await page.evaluate(() => {
      const svg = document.querySelector("svg");
      return svg ? svg.outerHTML : null;
    });
    if (svgData) {
      writeFileSync(svgPath, svgData);
    }

    // Export PNG
    await page.screenshot({ path: pngPath, fullPage: false });

    return { pngPath, svgPath };
  } finally {
    await browser.close();
  }
}
