import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import puppeteer from "puppeteer";

export interface CompositePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CompositeOptions {
  slidePng: string;
  illustrationPng: string;
  outputPath: string;
  position?: CompositePosition;
}

export async function compositeIllustration(
  opts: CompositeOptions,
): Promise<string> {
  const { slidePng, illustrationPng, outputPath, position } = opts;

  mkdirSync(dirname(outputPath), { recursive: true });

  const slideBuf = readFileSync(slidePng);
  const illusBuf = readFileSync(illustrationPng);
  const slideB64 = btoa(String.fromCharCode(...new Uint8Array(slideBuf)));
  const illusB64 = btoa(String.fromCharCode(...new Uint8Array(illusBuf)));

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    const result: string = await page.evaluate(
      // deno-lint-ignore no-explicit-any
      async (slideDataUri: string, illusDataUri: string, pos: any) => {
        // deno-lint-ignore no-explicit-any
        const loadImg = (src: string): Promise<any> =>
          new Promise((resolve, reject) => {
            // deno-lint-ignore no-explicit-any
            const img = new (globalThis as any).Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          });

        const slideImg = await loadImg(slideDataUri);
        const illusImg = await loadImg(illusDataUri);

        const w = slideImg.naturalWidth;
        const h = slideImg.naturalHeight;

        // deno-lint-ignore no-explicit-any
        const canvas = (globalThis as any).document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;

        ctx.drawImage(slideImg, 0, 0, w, h);

        let ix: number;
        let iy: number;
        let iw: number;
        let ih: number;

        if (pos) {
          ix = pos.x;
          iy = pos.y;
          iw = pos.width;
          ih = pos.height;
        } else {
          iw = Math.round(w * 0.25);
          ih = Math.round(
            iw * (illusImg.naturalHeight / illusImg.naturalWidth),
          );
          ix = Math.round(w - iw - w * 0.04);
          iy = Math.round(h - ih - h * 0.04);
        }

        ctx.drawImage(illusImg, ix, iy, iw, ih);

        return canvas.toDataURL("image/png").split(",")[1];
      },
      `data:image/png;base64,${slideB64}`,
      `data:image/png;base64,${illusB64}`,
      position,
    );

    writeFileSync(outputPath, new Uint8Array(atob(result).split("").map((c) => c.charCodeAt(0))));
    return outputPath;
  } finally {
    await browser.close();
  }
}
