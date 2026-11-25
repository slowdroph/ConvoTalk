import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./providers/AuthProvider";
import { ToastProvider } from "./providers/ToastProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import App from "./App";
import "./i18n";
import "./index.css";

// Prerendered pages ship their SEO tags in the HTML. react-helmet-async does
// not adopt them, it appends a fresh set, so drop the static ones first: the
// live DOM would otherwise contain a second canonical, hreflang cluster and
// Open Graph block. Crawlers that do not run JS still get the static tags.
const PRERENDERED_HEAD_TAGS = [
    "title",
    'link[rel="canonical"]',
    'link[rel="alternate"][hreflang]',
    'meta[name="description"]',
    'meta[name="robots"]',
    'meta[property^="og:"]',
    'meta[name^="twitter:"]',
    'script[type="application/ld+json"]',
].join(",");

document.head
    .querySelectorAll(PRERENDERED_HEAD_TAGS)
    .forEach((element) => element.remove());

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <HelmetProvider>
            <ThemeProvider>
                <ToastProvider>
                    <AuthProvider>
                        <LanguageProvider>
                            <App />
                        </LanguageProvider>
                    </AuthProvider>
                </ToastProvider>
            </ThemeProvider>
        </HelmetProvider>
    </StrictMode>,
);

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
}
