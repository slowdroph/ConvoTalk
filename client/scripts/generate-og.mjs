#!/usr/bin/env node
/**
 * Generates public/og/<locale>.png (1200x630) from each locale's hero copy.
 *
 * Run manually when the copy or the brand changes:
 *   node scripts/generate-og.mjs
 */
import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUTPUT_DIR = join(ROOT, "public/og");

const LOCALES = [
    { file: "en", json: "en" },
    { file: "es", json: "es" },
    { file: "pt-br", json: "pt-BR" },
    { file: "fr", json: "fr" },
];

function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function template({ title, highlight, subtitle }, fontBase64) {
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: "HG";
    font-weight: 100 900;
    src: url(data:font/woff2;base64,${fontBase64}) format("woff2");
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px;
    background: #0b0f0d;
    font-family: "HG", sans-serif;
    color: #e6efe6;
    position: relative; overflow: hidden;
  }
  .glow {
    position: absolute; border-radius: 50%; filter: blur(90px);
  }
  .glow-a {
    width: 620px; height: 620px; left: -120px; top: -260px;
    background: rgba(0, 168, 75, 0.35);
  }
  .glow-b {
    width: 520px; height: 520px; right: -160px; bottom: -240px;
    background: rgba(89, 224, 123, 0.18);
  }
  .dots {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(89, 224, 123, 0.16) 1px, transparent 1px);
    background-size: 26px 26px;
    mask-image: linear-gradient(to bottom right, #000 0%, transparent 70%);
    -webkit-mask-image: linear-gradient(to bottom right, #000 0%, transparent 70%);
  }
  .content {
    position: relative; height: 100%;
    padding: 72px 80px;
    display: flex; flex-direction: column;
  }
  .brand {
    display: flex; align-items: center; gap: 14px;
    font-size: 30px; font-weight: 700; letter-spacing: -0.02em;
  }
  .dot {
    width: 16px; height: 16px; border-radius: 50%;
    background: #59e07b; box-shadow: 0 0 20px rgba(89, 224, 123, 0.8);
  }
  h1 {
    margin-top: auto;
    font-size: 84px; line-height: 1.05; font-weight: 800;
    letter-spacing: -0.035em; max-width: 900px;
  }
  h1 span {
    display: block;
    background: linear-gradient(90deg, #59e07b, #77fd94);
    -webkit-background-clip: text; background-clip: text;
    color: transparent;
  }
  p {
    margin-top: 26px; max-width: 760px;
    font-size: 27px; line-height: 1.4; color: #bccaba;
  }
  .footer {
    margin-top: auto; display: flex; align-items: center; justify-content: space-between;
    font-size: 21px; color: #7c8e83; font-weight: 500;
  }
  .tag {
    border: 1px solid rgba(89, 224, 123, 0.35);
    border-radius: 999px; padding: 8px 18px;
    font-size: 18px; color: #59e07b; font-weight: 600;
  }
</style>
</head>
<body>
  <div class="glow glow-a"></div>
  <div class="glow glow-b"></div>
  <div class="dots"></div>
  <div class="content">
    <div class="brand"><span class="dot"></span>ConvoTalk</div>
    <h1>${escapeHtml(title)}<span>${escapeHtml(highlight)}</span></h1>
    <p>${escapeHtml(subtitle)}</p>
    <div class="footer">
      <span>convotalk.live</span>
      <span class="tag">Web app · PWA</span>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
    const fontBase64 = (await readFile(
        join(ROOT, "public/fonts/hanken-grotesk-latin.woff2"),
    )).toString("base64");

    await mkdir(OUTPUT_DIR, { recursive: true });

    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1200, height: 630 },
        deviceScaleFactor: 1,
    });

    for (const locale of LOCALES) {
        const home = JSON.parse(
            await readFile(
                join(ROOT, `src/i18n/locales/${locale.json}/home.json`),
                "utf8",
            ),
        );
        const copy = {
            title: home.hero.title,
            highlight: home.hero.titleHighlight,
            subtitle: home.hero.subtitle,
        };

        await page.setContent(template(copy, fontBase64), {
            waitUntil: "load",
        });
        await page.evaluate(() => document.fonts.ready);

        const path = join(OUTPUT_DIR, `${locale.file}.png`);
        await page.screenshot({ path, clip: { x: 0, y: 0, width: 1200, height: 630 } });
        console.log(`wrote ${path}`);
    }

    await browser.close();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
