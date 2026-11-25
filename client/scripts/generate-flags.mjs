#!/usr/bin/env node
/**
 * Copies the four language flags out of `country-flag-icons` as plain SVG
 * files (2.6 KB total).
 *
 * Importing them as React components made Rollup hoist them into the shared
 * chunk holding every country flag, so a page showing four flags downloaded
 * 200 KB of JavaScript. As static assets they cost no JavaScript at all.
 */
import { copyFile, mkdir } from "node:fs/promises";

const FLAGS = { us: "US", es: "ES", br: "BR", fr: "FR" };
const OUTPUT = new URL("../public/flags/", import.meta.url);

await mkdir(OUTPUT, { recursive: true });

for (const [name, code] of Object.entries(FLAGS)) {
    await copyFile(
        new URL(
            `../node_modules/country-flag-icons/3x2/${code}.svg`,
            import.meta.url,
        ),
        new URL(`${name}.svg`, OUTPUT),
    );
    console.log(`public/flags/${name}.svg`);
}
