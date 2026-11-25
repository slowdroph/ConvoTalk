#!/usr/bin/env node
/**
 * Build-time static generation for the public pages.
 *
 * Renders every public route in every locale with the production bundle,
 * serializes the document and writes it to `dist/<route>.html`. Netlify then
 * serves those files directly, so crawlers get complete HTML with the correct
 * language, canonical and hreflang cluster instead of an empty `<div id="root">`.
 *
 * Also writes the sitemap index and one sitemap per locale.
 *
 * The build fails when a page renders without content, without an `<h1>`, with
 * the wrong canonical, the wrong `<html lang>`, an incomplete hreflang cluster,
 * or a local URL in the output.
 */
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const DIST_DIR = resolve(fileURLToPath(new URL("../dist", import.meta.url)));
const SITE_URL = "https://convotalk.live";

/** Locale segment, BCP47 tag, browser locale and language for `<html lang>`. */
const LOCALES = [
    { segment: "", tag: "en", browser: "en-US" },
    { segment: "es", tag: "es", browser: "es-ES" },
    { segment: "pt-br", tag: "pt-BR", browser: "pt-BR" },
    { segment: "fr", tag: "fr", browser: "fr-FR" },
];

/**
 * Public pages, with the source file used for the sitemap `lastmod`.
 * `noindex` pages are still rendered for visitors, but they carry no canonical
 * or hreflang cluster and are left out of the sitemaps.
 */
const PAGES = [
    { path: "/", source: "src/pages/HomePage.tsx" },
    { path: "/login", source: "src/pages/LoginPage.tsx" },
    { path: "/terms", source: "src/pages/TermsPage.tsx" },
    { path: "/privacy", source: "src/pages/PrivacyPage.tsx" },
    {
        path: "/forgot-password",
        source: "src/pages/ForgotPasswordPage.tsx",
        noindex: true,
    },
];

const CONTENT_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
    ".txt": "text/plain; charset=utf-8",
    ".webmanifest": "application/manifest+json",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".xml": "application/xml; charset=utf-8",
};

/** "@es" + "/login" -> "/es/login"; "" + "/" -> "/" */
function urlFor(segment, path) {
    if (!segment) return path;
    return path === "/" ? `/${segment}` : `/${segment}${path}`;
}

/** "/es/login" -> "es/login.html"; "/" -> "index.html" */
function fileFor(urlPath) {
    return urlPath === "/" ? "index.html" : `${urlPath.slice(1)}.html`;
}

function absolute(urlPath) {
    return `${SITE_URL}${urlPath}`;
}

/** Minimal static file server for the built output. */
function createStaticServer() {
    return createServer(async (request, response) => {
        const pathname = decodeURIComponent(
            new URL(request.url ?? "/", "http://127.0.0.1").pathname,
        );
        const filePath = resolve(
            DIST_DIR,
            `.${pathname.endsWith("/") ? `${pathname}index.html` : pathname}`,
        );

        if (filePath !== DIST_DIR && !filePath.startsWith(DIST_DIR + sep)) {
            response.writeHead(403, { "Content-Type": "text/plain" });
            response.end("Forbidden");
            return;
        }

        let body = null;
        let servedPath = filePath;

        try {
            body = await readFile(filePath);
        } catch {
            // A route only becomes a file once it has been prerendered. Until
            // then mirror production: hand back the app shell and let the
            // client router render the requested route.
            try {
                servedPath = join(DIST_DIR, "app.html");
                body = await readFile(servedPath);
            } catch {
                body = null;
            }
        }

        if (!body) {
            response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            response.end("Not found");
            return;
        }

        response.writeHead(200, {
            "Content-Type":
                CONTENT_TYPES[extname(servedPath).toLowerCase()] ??
                "application/octet-stream",
            "Cache-Control": "no-store",
        });
        response.end(body);
    });
}

async function launchBrowser() {
    try {
        return await chromium.launch();
    } catch (error) {
        const message = String(error?.message ?? "");
        if (!message.includes("Executable doesn't exist")) throw error;
        console.log("Chromium for Playwright is missing — installing it…");
        execSync("npx playwright install chromium", { stdio: "inherit" });
        return chromium.launch();
    }
}

function lastmodFor(source) {
    try {
        const value = execSync(`git log -1 --format=%cs -- "${source}"`, {
            stdio: ["ignore", "pipe", "ignore"],
        })
            .toString()
            .trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    } catch {
        // git unavailable (shallow clone, tarball): fall through
    }
    return new Date().toISOString().slice(0, 10);
}

async function writeSitemaps() {
    const lastmod = new Map(
        PAGES.map((page) => [page.path, lastmodFor(page.source)]),
    );

    const children = [];

    for (const locale of LOCALES) {
        const name = `sitemap-${locale.segment || "en"}.xml`;
        const urls = PAGES.filter((page) => !page.noindex).map((page) => {
            const urlPath = urlFor(locale.segment, page.path);
            const mod = lastmod.get(page.path);
            return `  <url>
    <loc>${absolute(urlPath)}</loc>
    <lastmod>${mod}</lastmod>
  </url>`;
        }).join("\n");

        await writeFile(
            join(DIST_DIR, name),
            `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
            "utf8",
        );

        children.push(name);
    }

    const indexLastmod = [...lastmod.values()].sort().at(-1);

    await writeFile(
        join(DIST_DIR, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${children
    .map(
        (name) => `  <sitemap>
    <loc>${absolute(`/${name}`)}</loc>
    <lastmod>${indexLastmod}</lastmod>
  </sitemap>`,
    )
    .join("\n")}
</sitemapindex>
`,
        "utf8",
    );

    return children;
}

async function prerenderLocale(browser, baseUrl, locale) {
    const context = await browser.newContext({
        locale: locale.browser,
        viewport: { width: 1440, height: 900 },
        serviceWorkers: "block",
    });

    // Fonts, ad tags and any other third party would only inject
    // non-deterministic markup into the snapshot.
    await context.route("**/*", (route) =>
        route.request().url().startsWith(baseUrl)
            ? route.continue()
            : route.abort(),
    );

    const summary = [];

    for (const pageSpec of PAGES) {
        const urlPath = urlFor(locale.segment, pageSpec.path);
        const file = fileFor(urlPath);
        const expectedCanonical = pageSpec.noindex ? null : absolute(urlPath);
        const expectedAlternates = pageSpec.noindex
            ? new Map()
            : new Map([
                  ...LOCALES.map((alt) => [
                      alt.tag,
                      absolute(urlFor(alt.segment, pageSpec.path)),
                  ]),
                  ["x-default", absolute(urlFor("", pageSpec.path))],
              ]);

        const page = await context.newPage();
        const pageErrors = [];
        page.on("pageerror", (error) => pageErrors.push(error.message));

        const step = async (label, action) => {
            try {
                return await action();
            } catch (error) {
                const rendered = await page
                    .evaluate(
                        () =>
                            document.getElementById("root")?.innerHTML.slice(
                                0,
                                600,
                            ) ?? "<empty>",
                    )
                    .catch(() => "<unavailable>");
                const detail =
                    error instanceof Error
                        ? error.message.split("\n")[0]
                        : String(error);
                throw new Error(
                    `[${urlPath}] ${label}: ${detail}\n--- #root ---\n${rendered}\n---`,
                );
            }
        };

        await step("navigation", () =>
            page.goto(`${baseUrl}${urlPath}`, {
                waitUntil: "domcontentloaded",
                timeout: 60_000,
            }),
        );
        await step("waiting for #root h1", () =>
            page.waitForSelector("#root h1", {
                state: "attached",
                timeout: 60_000,
            }),
        );
        if (pageSpec.noindex) {
            await step("waiting for the noindex meta", () =>
                page.waitForFunction(
                    () =>
                        (
                            document
                                .querySelector('meta[name="robots"]')
                                ?.getAttribute("content") ?? ""
                        ).includes("noindex"),
                    undefined,
                    { timeout: 30_000 },
                ),
            );
        } else {
            await step("waiting for the canonical", () =>
                page.waitForFunction(
                    (expected) =>
                        document
                            .querySelector('link[rel="canonical"]')
                            ?.getAttribute("href") === expected,
                    expectedCanonical,
                    { timeout: 30_000 },
                ),
            );
        }
        await step("waiting for <html lang>", () =>
            page.waitForFunction(
                (expected) => document.documentElement.lang === expected,
                locale.tag,
                { timeout: 30_000 },
            ),
        );

        const metrics = await page.evaluate(() => {
            // React injects runtime modulepreload hints with absolute URLs
            // derived from the prerender origin. They are redundant and would
            // publish a localhost URL, so drop them before serializing.
            document
                .querySelectorAll(
                    'link[rel="modulepreload"][href^="http://127.0.0.1"], link[rel="modulepreload"][href^="http://localhost"]',
                )
                .forEach((element) => element.remove());

            // Elements below the fold never intersect during prerender, so
            // serialize them already revealed.
            document
                .querySelectorAll(".opacity-0.translate-y-8")
                .forEach((element) => {
                    element.classList.remove("opacity-0", "translate-y-8");
                    element.classList.add("opacity-100", "translate-y-0");
                });

            const root = document.getElementById("root");
            const h1 = root?.querySelector("h1");

            return {
                textLength: (root?.textContent ?? "")
                    .replace(/\s+/g, " ")
                    .trim().length,
                h1Count: root?.querySelectorAll("h1").length ?? 0,
                h1Text: (h1?.textContent ?? "").replace(/\s+/g, " ").trim(),
                title: document.title.trim(),
                canonical:
                    document
                        .querySelector('link[rel="canonical"]')
                        ?.getAttribute("href") ?? null,
                robots:
                    document
                        .querySelector('meta[name="robots"]')
                        ?.getAttribute("content") ?? null,
                lang: document.documentElement.lang,
                alternates: [
                    ...document.querySelectorAll(
                        'link[rel="alternate"][hreflang]',
                    ),
                ].map((element) => [
                    element.getAttribute("hreflang"),
                    element.getAttribute("href"),
                ]),
            };
        });

        const problems = [];

        // Enough to rule out an empty shell; the smallest page renders ~130 chars.
        if (metrics.textLength < 80) {
            problems.push(
                `rendered text is too short (${metrics.textLength} chars)`,
            );
        }
        if (metrics.h1Count < 1) problems.push("no <h1> inside #root");
        if (!metrics.title) problems.push("empty <title>");
        if (pageSpec.noindex) {
            if (metrics.canonical !== null) {
                problems.push(
                    `noindex page declares a canonical (${metrics.canonical})`,
                );
            }
            if (metrics.alternates.length !== 0) {
                problems.push(
                    `noindex page declares ${metrics.alternates.length} hreflang links`,
                );
            }
            if (!metrics.robots?.includes("noindex")) {
                problems.push("missing the noindex robots meta");
            }
        } else {
            if (metrics.canonical !== expectedCanonical) {
                problems.push(
                    `canonical is "${metrics.canonical}", expected "${expectedCanonical}"`,
                );
            }
            if (metrics.alternates.length !== expectedAlternates.size) {
                problems.push(
                    `expected ${expectedAlternates.size} hreflang links, found ${metrics.alternates.length}`,
                );
            }
            for (const [hreflang, href] of expectedAlternates) {
                const found = metrics.alternates.find(
                    ([tag]) => tag === hreflang,
                );
                if (found?.[1] !== href) {
                    problems.push(
                        `hreflang "${hreflang}" is "${found?.[1] ?? "missing"}", expected "${href}"`,
                    );
                }
            }
        }
        if (metrics.lang !== locale.tag) {
            problems.push(
                `<html lang> is "${metrics.lang}", expected "${locale.tag}"`,
            );
        }
        if (pageErrors.length > 0) {
            problems.push(`page errors: ${pageErrors.join(" | ")}`);
        }

        if (problems.length > 0) {
            throw new Error(
                `Prerender failed for ${urlPath}:\n  - ${problems.join("\n  - ")}`,
            );
        }

        const serialized = await page.evaluate(
            () => document.documentElement.outerHTML,
        );
        const html = `<!doctype html>\n${serialized.split(baseUrl).join("")}`;
        const outputPath = join(DIST_DIR, file);
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, html, "utf8");
        await page.close();

        const written = await readFile(outputPath, "utf8");
        if (written.charCodeAt(0) === 0xfeff) {
            throw new Error(`${file} was written with a BOM`);
        }
        if (/<div id="root">\s*<\/div>/.test(written)) {
            throw new Error(`${file} still has an empty #root`);
        }
        if (/localhost|127\.0\.0\.1/.test(written)) {
            throw new Error(`${file} leaks a local URL into the deployed HTML`);
        }

        summary.push({
            urlPath,
            file,
            bytes: Buffer.byteLength(html),
            h1: metrics.h1Text,
        });
    }

    await context.close();
    return summary;
}

async function main() {
    const shellPath = join(DIST_DIR, "index.html");
    if (!existsSync(shellPath)) {
        throw new Error("dist/index.html not found. Run `vite build` first.");
    }

    // Preserve the untouched shell: the authenticated app is still a SPA and
    // netlify.toml rewrites its routes to /app.html.
    await writeFile(
        join(DIST_DIR, "app.html"),
        await readFile(shellPath, "utf8"),
        "utf8",
    );

    // The sitemap is generated below; drop the hand-maintained copy.
    await rm(join(DIST_DIR, "sitemap.xml"), { force: true });

    const server = createStaticServer();
    await new Promise((done) => server.listen(0, "127.0.0.1", done));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    let browser;
    try {
        browser = await launchBrowser();
        const summary = [];

        for (const locale of LOCALES) {
            summary.push(...(await prerenderLocale(browser, baseUrl, locale)));
        }

        const sitemaps = await writeSitemaps();

        console.log("\nPrerendered public pages:");
        for (const row of summary) {
            console.log(
                `  ${row.urlPath.padEnd(20)} -> dist/${row.file.padEnd(26)} ${String(
                    row.bytes,
                ).padStart(7)} B  "${row.h1}"`,
            );
        }
        console.log(`\nSitemaps: sitemap.xml -> ${sitemaps.join(", ")}\n`);
    } finally {
        if (browser) await browser.close();
        await new Promise((done) => server.close(done));
    }
}

main().catch((error) => {
    console.error(
        `\n✗ Prerender failed: ${error instanceof Error ? error.message : error}\n`,
    );
    process.exitCode = 1;
});
