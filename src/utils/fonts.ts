const fontCache = new Map<string, string>();

export async function embedFonts(cssUrl: string): Promise<string> {
  const cached = fontCache.get(cssUrl);
  if (cached) return cached;

  try {
    const cssRes = await fetch(cssUrl);
    if (!cssRes.ok) return "";
    let css = await cssRes.text();

    const urlRegex = /url\(([^)]+)\)/g;
    const replacements: { original: string; dataUri: string }[] = [];

    let match;
    while ((match = urlRegex.exec(css)) !== null) {
      const raw = match[1].replace(/['"]/g, "");
      const absoluteUrl = raw.startsWith("http") ? raw : new URL(raw, cssUrl).href;

      try {
        const fontRes = await fetch(absoluteUrl);
        if (!fontRes.ok) continue;
        const bytes = new Uint8Array(await fontRes.arrayBuffer());
        let binary = "";
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        const base64 = btoa(binary);
        const mimeType = absoluteUrl.endsWith(".woff2")
          ? "font/woff2"
          : absoluteUrl.endsWith(".woff")
          ? "font/woff"
          : absoluteUrl.endsWith(".ttf")
          ? "font/ttf"
          : "application/octet-stream";
        replacements.push({ original: match[0], dataUri: `url(data:${mimeType};base64,${base64})` });
      } catch {
        // Skip failed font downloads — let the browser handle it
      }
    }

    for (const { original, dataUri } of replacements) {
      css = css.replace(original, dataUri);
    }

    fontCache.set(cssUrl, css);
    return css;
  } catch {
    return "";
  }
}
