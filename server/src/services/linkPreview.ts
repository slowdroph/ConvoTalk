import type { LinkPreview } from "@shared/types";
import { lookup } from "dns/promises";
import { request as httpRequest } from "http";
import { request as httpsRequest, RequestOptions } from "https";
import type { LookupFunction } from "net";
import { isPrivateIp } from "../utils/ssrf";

const MAX_HTML_BYTES = 300_000;
const FETCH_TIMEOUT_MS = 5_000;
const MAX_REDIRECTS = 3;
const MAX_PREVIEW_TITLE = 150;
const MAX_PREVIEW_DESCRIPTION = 400;

function metaContent(
    html: string,
    propertyNames: string[],
): string | null {
    for (const name of propertyNames) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(
            `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`,
            "i",
        );
        const match = html.match(re);
        if (match) {
            const decoded = match[1].replace(/&amp;/g, "&")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">");
            return decoded.trim();
        }
    }
    return null;
}

function titleFromHtml(html: string): string | null {
    const og = metaContent(html, ["og:title", "twitter:title"]);
    if (og) return og;
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : null;
}

function descriptionFromHtml(html: string): string | null {
    return metaContent(html, [
        "og:description",
        "twitter:description",
        "description",
    ]);
}

function imageFromHtml(html: string): string | null {
    return metaContent(html, ["og:image", "twitter:image"]);
}

async function resolvePublicIp(hostname: string): Promise<string> {
    const addresses = await lookup(hostname, { all: true });
    const publicAddress = addresses.find((addr) => !isPrivateIp(addr.address));
    if (!publicAddress) {
        throw new Error("Blocked hostname");
    }
    return publicAddress.address;
}

interface PinnedResponse {
    status: number;
    headers: Record<string, string | string[] | undefined>;
    arrayBuffer(): Promise<ArrayBuffer>;
}

function fetchPinned(
    url: string,
    signal: AbortSignal,
): Promise<PinnedResponse> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const isHttps = parsed.protocol === "https:";
        const port = Number(parsed.port) || (isHttps ? 443 : 80);

        resolvePublicIp(parsed.hostname)
            .then((ip) => {
                const options: RequestOptions = {
                    hostname: parsed.hostname,
                    port,
                    path: parsed.pathname + parsed.search,
                    method: "GET",
                    headers: {
                        "user-agent":
                            "Mozilla/5.0 (compatible; ChatAppLinkPreview/1.0)",
                        accept: "text/html,application/xhtml+xml",
                    },
                    lookup: (((
                        _hostname: string,
                        _options: object,
                        callback: (err: Error | null, address?: string, family?: number) => void,
                    ) => callback(null, ip, isHttps ? 6 : 4)) as unknown) as LookupFunction,
                };

                const requestFn = isHttps ? httpsRequest : httpRequest;
                const req = requestFn(options, (res) => {
                    const chunks: Buffer[] = [];
                    res.on("data", (chunk: Buffer) => chunks.push(chunk));
                    res.on("end", () => {
                        const body = Buffer.concat(chunks);
                        resolve({
                            status: res.statusCode ?? 0,
                            headers: res.headers as Record<string, string | string[] | undefined>,
                            arrayBuffer: async () =>
                                body.buffer.slice(
                                    body.byteOffset,
                                    body.byteOffset + body.byteLength,
                                ),
                        });
                    });
                });

                req.on("error", (err) => reject(err));

                if (signal.aborted) {
                    req.destroy(new Error("Aborted"));
                    return;
                }
                signal.addEventListener("abort", () => {
                    req.destroy(new Error("Aborted"));
                });

                req.end();
            })
            .catch(reject);
    });
}

async function fetchWithSsrProtection(
    url: string,
    controller: AbortController,
): Promise<PinnedResponse> {
    let currentUrl: string | null = url;

    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
        const res = await fetchPinned(currentUrl, controller.signal);

        if (res.status >= 300 && res.status < 400) {
            const location = res.headers["location"];
            const locationHeader = Array.isArray(location)
                ? location[0]
                : location;
            if (!locationHeader) throw new Error("Redirect without location");
            currentUrl = new URL(locationHeader, currentUrl!).toString();
            await resolvePublicIp(new URL(currentUrl).hostname);
            continue;
        }

        return res;
    }

    throw new Error("Too many redirects");
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const res = await fetchWithSsrProtection(url, controller);

        if (res.status < 200 || res.status >= 300) {
            throw new Error(`HTTP ${res.status}`);
        }

        const contentTypeHeader = res.headers["content-type"];
        const contentType = Array.isArray(contentTypeHeader)
            ? contentTypeHeader[0]
            : contentTypeHeader;
        if (!contentType || !contentType.includes("text/html")) {
            throw new Error("Not HTML");
        }

        const buffer = await res.arrayBuffer();
        const html = new TextDecoder("utf-8")
            .decode(buffer.slice(0, MAX_HTML_BYTES));

        const title = titleFromHtml(html);
        const description = descriptionFromHtml(html);
        const image = imageFromHtml(html);

        return {
            url,
            title: title
                ? title.slice(0, MAX_PREVIEW_TITLE)
                : new URL(url).hostname,
            description: description
                ? description.slice(0, MAX_PREVIEW_DESCRIPTION)
                : undefined,
            image: image || undefined,
        };
    } finally {
        clearTimeout(timeout);
    }
}