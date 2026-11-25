import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    type LanguageCode,
} from "@shared/i18n";
import { languageFromPath, localizePath, localeSegment } from "../i18n/routing";

const SITE_URL = "https://convotalk.live";
const SITE_NAME = "ConvoTalk";
const OG_IMAGE_WIDTH = "1200";
const OG_IMAGE_HEIGHT = "630";

const OG_LOCALE: Record<LanguageCode, string> = {
    en: "en_US",
    es: "es_ES",
    "pt-BR": "pt_BR",
    fr: "fr_FR",
};

interface SEOProps {
    title?: string;
    description?: string;
    /** Locale-independent path of this page, e.g. "/terms". */
    canonical?: string;
    image?: string;
    type?: string;
    noindex?: boolean;
}

export default function SEO({
    title,
    description,
    canonical = "/",
    image,
    type = "website",
    noindex = false,
}: SEOProps) {
    const { t } = useTranslation("common");
    const { pathname } = useLocation();
    const language = languageFromPath(pathname) ?? DEFAULT_LANGUAGE;
    const resolvedDescription = description ?? t("seo.defaultDescription");
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const canonicalUrl = `${SITE_URL}${localizePath(language, canonical)}`;
    const ogImage =
        image ??
        `${SITE_URL}/og/${localeSegment(language) || DEFAULT_LANGUAGE}.png`;

    const alternates = SUPPORTED_LANGUAGES.map((code) => ({
        code,
        href: `${SITE_URL}${localizePath(code, canonical)}`,
    }));
    const xDefault = `${SITE_URL}${localizePath(DEFAULT_LANGUAGE, canonical)}`;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={resolvedDescription} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}
            {!noindex && <link rel="canonical" href={canonicalUrl} />}
            {!noindex &&
                alternates.map((alternate) => (
                    <link
                        key={alternate.code}
                        rel="alternate"
                        hrefLang={alternate.code}
                        href={alternate.href}
                    />
                ))}
            {!noindex && (
                <link rel="alternate" hrefLang="x-default" href={xDefault} />
            )}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={resolvedDescription} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:image:width" content={OG_IMAGE_WIDTH} />
            <meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
            <meta property="og:image:alt" content={fullTitle} />
            {!noindex && <meta property="og:url" content={canonicalUrl} />}
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:locale" content={OG_LOCALE[language]} />
            {!noindex &&
                SUPPORTED_LANGUAGES.filter((code) => code !== language).map(
                    (code) => (
                        <meta
                            key={code}
                            property="og:locale:alternate"
                            content={OG_LOCALE[code]}
                        />
                    ),
                )}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={resolvedDescription} />
            <meta name="twitter:image" content={ogImage} />
        </Helmet>
    );
}
