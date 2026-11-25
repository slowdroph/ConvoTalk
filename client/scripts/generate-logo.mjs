#!/usr/bin/env node
/**
 * Regenerates the header logo from `public/convo_talk_logo.png`.
 *
 * The source is a 535x453 PNG of 118 KB, rendered at 32-80 px tall. A 192 px
 * wide WebP is sharp on 2x displays and removes ~95% of the bytes.
 */
import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

const WIDTH = 192;
const SOURCE = new URL("../public/convo_talk_logo.png", import.meta.url);
const OUTPUT = new URL("../public/logo-192.webp", import.meta.url);

const dataUrl = `data:image/png;base64,${(await readFile(SOURCE)).toString("base64")}`;

const browser = await chromium.launch();
const page = await browser.newPage();

const result = await page.evaluate(
    async ({ dataUrl: source, width }) => {
        const image = new Image();
        image.src = source;
        await image.decode();

        const height = Math.round(
            (image.naturalHeight * width) / image.naturalWidth,
        );
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) throw new Error("canvas 2d context unavailable");
        context.drawImage(image, 0, 0, width, height);

        return {
            webp: canvas.toDataURL("image/webp", 0.92),
            height,
        };
    },
    { dataUrl, width: WIDTH },
);

await browser.close();

const bytes = Buffer.from(result.webp.split(",")[1], "base64");
await writeFile(OUTPUT, bytes);

console.log(
    `public/logo-192.webp  ${WIDTH}x${result.height}  ${bytes.length} B`,
);
