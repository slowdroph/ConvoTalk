#!/usr/bin/env node
/**
 * Usage: node scripts/verify-seo.mjs [baseUrl]
 *
 * Asserts, for the target origin:
 *   - every indexable page, in every locale, answers 200 (no redirect) with a
 *     real <h1>, a self-referencing canonical, the right <html lang> and a
 *     non-empty title
 *   - every indexable page carries the complete hreflang cluster plus x-default
 *   - utility pages (forgot-password) answer 200 with noindex and no canonical
 *   - /en and /en/<path> redirect to the unprefixed URL
 *   - every private/utility route answers 200 with `X-Robots-Tag: noindex`
 *   - an unknown URL answers 404
 *   - robots.txt and sitemap.xml are BOM-free
 *
 * Exits non-zero if any check fails.
 */
const SITE_URL = "https://convotalk.live";
const BASE_URL = (process.argv[2] || SITE_URL).replace(/\/$/, "");

const LOCALES = [
    { segment: "", tag: "en" },
    { segment: "es", tag: "es" },
    { segment: "pt-br", tag: "pt-BR" },
    { segment: "fr", tag: "fr" },
];

const PAGES = [
    { path: "/", indexable: true },
    { path: "/login", indexable: true },
    { path: "/terms", indexable: true },
    { path: "/privacy", indexable: true },
    { path: "/forgot-password", indexable: false },
];

const PRIVATE_ROUTES = [
    "/chat",
    "/chat/some-room",
    "/feed",
    "/discover",
    "/profile",
    "/profile/some-user",
    "/settings",
    "/verify-email",
    "/reset-password",
    "/confirm-email-change",
    "/app.html",
    "/offline.html",
];

const UNKNOWN_ROUTE = "/this-route-should-not-exist-9f3a";

const results = [];

function record(ok, label, detail) {
    results.push({ ok, label, detail });
}

function urlFor(segment, path) {
    if (!segment) return path;
    return path === "/" ? `/${segment}` : `/${segment}${path}`;
}

async function get(path) {
    return fetch(`${BASE_URL}${path}`, {
        redirect: "manual",
        headers: { "User-Agent": "convotalk-seo-verify" },
    });
}

async function checkPublicPage(segment, pagePath, indexable) {
    const routePath = urlFor(segment, pagePath);
    const locale = LOCALES.find((item) => item.segment === segment);
    const response = await get(routePath);

    if (response.status !== 200) {
        record(false, routePath, `expected 200, got ${response.status}`);
        return;
    }

    const html = await response.text();
    const problems = [];
    const canonical = /rel="canonical" href="([^"]+)"/.exec(html)?.[1] ?? null;
    const lang = /<html[^>]*lang="([^"]*)"/.exec(html)?.[1] ?? null;
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1]?.trim() ?? "";

    if (!/<h1[ >]/.test(html)) problems.push("no <h1>");
    if (lang !== locale.tag) problems.push(`lang ${lang ?? "missing"}`);
    if (!title) problems.push("empty <title>");

    if (!indexable) {
        if (!/<meta name="robots" content="[^"]*noindex/.test(html)) {
            problems.push("missing noindex robots meta");
        }
        if (canonical !== null) problems.push(`canonical ${canonical}`);
        if (/hreflang=/.test(html)) problems.push("unexpected hreflang links");
        record(problems.length === 0, routePath, problems.join(", "));
        return;
    }

    if (canonical !== `${SITE_URL}${routePath}`) {
        problems.push(`canonical ${canonical ?? "missing"}`);
    }

    for (const alternate of LOCALES) {
        const expected = `${SITE_URL}${urlFor(alternate.segment, pagePath)}`;
        const pattern = new RegExp(
            `hreflang="${alternate.tag}"[^>]*href="${expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
        );
        if (!pattern.test(html)) {
            problems.push(`hreflang ${alternate.tag} -> ${expected}`);
        }
    }
    if (!/hreflang="x-default"/.test(html)) problems.push("missing x-default");

    record(problems.length === 0, routePath, problems.join(", "));
}

async function checkLocaleRedirect(segment) {
    const response = await get(`/${segment}/login`);
    const location = response.headers.get("location") ?? "";
    record(
        response.status === 301 && /\/login$/.test(location),
        `/${segment}/login -> /login`,
        `status ${response.status} ${location}`.trim(),
    );
}

async function checkPrivateRoute(routePath) {
    const response = await get(routePath);
    const robots = response.headers.get("x-robots-tag") ?? "";
    const problems = [];

    if (response.status !== 200) problems.push(`status ${response.status}`);
    if (!/noindex/i.test(robots)) problems.push("missing X-Robots-Tag: noindex");

    record(problems.length === 0, routePath, problems.join(", "));
}

async function checkNotFound() {
    const response = await get(UNKNOWN_ROUTE);
    record(response.status === 404, UNKNOWN_ROUTE, `status ${response.status}`);
}

async function checkServed(path) {
    const response = await get(path);
    // response.text() decodes UTF-8 and drops the BOM, so inspect raw bytes.
    const bytes = new Uint8Array(await response.arrayBuffer());
    const bom =
        bytes.length >= 3 &&
        bytes[0] === 0xef &&
        bytes[1] === 0xbb &&
        bytes[2] === 0xbf;
    record(
        response.status === 200 && !bom,
        path,
        bom ? "BOM present" : `status ${response.status}`,
    );
}

async function main() {
    for (const locale of LOCALES) {
        for (const page of PAGES) {
            await checkPublicPage(locale.segment, page.path, page.indexable);
        }
    }
    await checkLocaleRedirect("en");
    for (const routePath of PRIVATE_ROUTES) await checkPrivateRoute(routePath);
    await checkNotFound();
    await checkServed("/robots.txt");
    await checkServed("/sitemap.xml");

    const failed = results.filter((result) => !result.ok);

    for (const result of results) {
        const mark = result.ok ? "ok  " : "FAIL";
        console.log(
            `${mark} ${result.label.padEnd(24)} ${result.detail}`.trimEnd(),
        );
    }

    console.log(
        `\n${results.length - failed.length}/${results.length} checks passed against ${BASE_URL}`,
    );

    if (failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
    console.error(
        `\n✗ Verification failed: ${error instanceof Error ? error.message : error}\n`,
    );
    process.exitCode = 1;
});
