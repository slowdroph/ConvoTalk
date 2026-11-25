const ADS_CONVERSION_ID = "AW-16805873570";
const GA4_ID = import.meta.env.VITE_GA4_ID as string | undefined;

interface GtagWindow extends Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
}

let started = false;

function start(): GtagWindow {
    const target = window as GtagWindow;
    const id = GA4_ID || ADS_CONVERSION_ID;

    target.dataLayer = target.dataLayer || [];
    target.gtag =
        target.gtag ||
        function gtag(...args: unknown[]) {
            target.dataLayer?.push(args);
        };
    target.gtag("js", new Date());
    target.gtag("config", id, { send_page_view: false });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    return target;
}

/**
 * Records a public page view. The tag is deliberately not in `index.html`:
 * the authenticated app is the most performance-sensitive surface and has no
 * organic search to measure, so it must never pay for a third-party script.
 */
export function trackPublicPageView(path: string): void {
    if (typeof window === "undefined" || navigator.webdriver) return;

    const target = started ? (window as GtagWindow) : start();
    started = true;

    target.gtag?.("event", "page_view", {
        page_path: path,
        page_location: `${window.location.origin}${path}`,
        page_title: document.title,
    });
}
