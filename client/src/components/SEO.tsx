import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { getCurrentLanguage } from "../i18n/formatters";

const SITE_URL = "https://convotalk.live";
const SITE_NAME = "ConvoTalk";
const DEFAULT_IMAGE = `${SITE_URL}/convo_talk_logo.png`;

interface SEOProps {
    title?: string;
    description?: string;
    canonical?: string;
    image?: string;
    type?: string;
}

export default function SEO({
    title,
    description,
    canonical,
    image = DEFAULT_IMAGE,
    type = "website",
}: SEOProps) {
    const { t } = useTranslation("common");
    const resolvedDescription = description ?? t("seo.defaultDescription");
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;
    const ogLocale = getCurrentLanguage().replace("-", "_");

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={resolvedDescription} />
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={resolvedDescription} />
            <meta property="og:image" content={image} />
            {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:locale" content={ogLocale} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={resolvedDescription} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
}