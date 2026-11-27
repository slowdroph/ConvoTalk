import { useState, useMemo } from "react";
import LocalizedLink from "../components/ui/LocalizedLink";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { DEFAULT_LANGUAGE } from "@shared/i18n";
import { Helmet } from "react-helmet-async";
import PreviewChat from "../components/Home/PreviewChat";
import Navbar from "../components/Home/Navbar";
import BackToTop from "../components/Home/BackToTop";
import Reveal from "../components/ui/Reveal";
import Icon from "../components/ui/Icon";
import SEO from "../components/SEO";
import { useScrollSpy } from "../hooks/useScrollSpy";
import SectionHeader from "../components/Home/SectionHeader";
import IconBadge from "../components/Home/IconBadge";
import {
    languageFromPath,
    localizePath,
    localeSegment,
} from "../i18n/routing";
import FeatureCard from "../components/Home/FeatureCard";

const FAQ_ITEMS = [1, 2, 3, 4, 5, 6, 7] as const;

export default function HomePage() {
    const { t } = useTranslation("home");
    const { activeSection, scrolled, showBackToTop } = useScrollSpy();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const { pathname } = useLocation();
    const language = languageFromPath(pathname) ?? DEFAULT_LANGUAGE;

    const structuredData = useMemo(() => {
        const origin = "https://convotalk.live";
        const organizationId = `${origin}/#organization`;

        return JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "Organization",
                    "@id": organizationId,
                    name: "ConvoTalk",
                    url: origin,
                    logo: {
                        "@type": "ImageObject",
                        url: `${origin}/icon-512.png`,
                        width: 512,
                        height: 512,
                    },
                },
                {
                    "@type": "WebSite",
                    "@id": `${origin}/#website`,
                    url: origin,
                    name: "ConvoTalk",
                    inLanguage: ["en", "es", "pt-BR", "fr"],
                    publisher: { "@id": organizationId },
                },
                {
                    "@type": "WebApplication",
                    "@id": `${origin}/#webapp`,
                    name: "ConvoTalk",
                    url: `${origin}${localizePath(language, "/")}`,
                    description: t("seo.structuredDescription"),
                    applicationCategory: "CommunicationApplication",
                    operatingSystem: "Web",
                    browserRequirements: "Requires JavaScript",
                    inLanguage: language,
                    isAccessibleForFree: true,
                    featureList: [
                        t("features.realtimeTitle"),
                        t("features.groupsTitle"),
                        t("features.callsTitle"),
                        t("features.filesTitle"),
                        t("features.searchTitle"),
                    ],
                    screenshot: `${origin}/og/${
                        localeSegment(language) || "en"
                    }.png`,
                    offers: {
                        "@type": "Offer",
                        price: "0",
                        priceCurrency: "BRL",
                    },
                    publisher: { "@id": organizationId },
                },
            ],
        });
    }, [t, language]);

    const toggleFaq = (index: number) => {
        setOpenFaq((prev) => (prev === index ? null : index));
    };

    return (
        <div className="min-h-dvh-fallback bg-background text-on-surface font-sans antialiased selection:bg-primary-container selection:text-white">
            <SEO
                title={t("seo.title")}
                description={t("seo.description")}
                canonical="/"
            />
            <Helmet>
                <script type="application/ld+json">{structuredData}</script>
            </Helmet>

            {/* 1. NAVBAR */}
            <Navbar activeSection={activeSection} scrolled={scrolled} />

            {/* 2. HERO */}
            <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-grid-dots">
                {/* Radial emerald glows */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-175 h-137.5 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute -top-24 right-10 w-96 h-96 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    {/* Version pill */}
                    <Reveal>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-surface-container-high/60 backdrop-blur text-xs font-medium text-on-surface mb-8 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-on-surface-variant">
                                {t("hero.badge")}
                            </span>
                        </div>
                    </Reveal>

                    {/* Title & Sub */}
                    <Reveal delay={100}>
                        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-on-surface max-w-4xl mx-auto leading-[1.15]">
                            {t("hero.title")} <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-primary-fixed to-primary-container">
                                {t("hero.titleHighlight")}
                            </span>
                        </h1>
                    </Reveal>

                    <Reveal delay={200}>
                        <p className="mt-6 text-lg sm:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                            {t("hero.subtitle")}
                        </p>
                    </Reveal>

                    {/* CTAs */}
                    <Reveal delay={300}>
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <LocalizedLink
                                to="/login?mode=register"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-linear-to-r from-primary-container to-primary text-white px-7 py-3.5 rounded-lg font-semibold text-sm shadow-[0_0_25px_rgba(0,168,75,0.4)] hover:shadow-[0_0_35px_rgba(89,224,123,0.6)] hover:-translate-y-0.5 transition"
                            >
                                <span>{t("hero.start")}</span>
                                <Icon name="arrow_forward" className="text-lg" />
                            </LocalizedLink>
                            <LocalizedLink
                                to="/login"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-outline-variant bg-surface-container/60 hover:bg-surface-container-high text-on-surface px-7 py-3.5 rounded-lg font-semibold text-sm transition"
                            >
                                <span>{t("hero.login")}</span>
                            </LocalizedLink>
                        </div>
                    </Reveal>

                    {/* Chat preview mockup */}
                    <div className="mt-14 max-w-4xl mx-auto text-left">
                        <PreviewChat />
                        <p className="text-center text-xs text-on-surface-variant mt-4">
                            {t("hero.previewHint")}
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. PRODUCT CAPABILITY STRIP */}
            <section className="border-y border-outline-variant/60 bg-surface-container-lowest/90 py-4 px-4 overflow-x-auto relative">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 min-w-max text-xs font-medium text-on-surface-variant">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 hover:border-primary/40 transition-colors">
                        <IconBadge name="bolt" />
                        <span>{t("strip.realtime")}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 hover:border-primary/40 transition-colors">
                        <IconBadge name="groups" />
                        <span>{t("strip.groups")}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 hover:border-primary/40 transition-colors">
                        <IconBadge name="videocam" />
                        <span>{t("strip.calls")}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 hover:border-primary/40 transition-colors">
                        <IconBadge name="attach_file" />
                        <span>{t("strip.files")}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 hover:border-primary/40 transition-colors">
                        <IconBadge name="search" />
                        <span>
                            {t("strip.search")}{" "}
                            <kbd className="px-1.5 py-0.5 bg-surface-container-high rounded text-[10px] border border-outline-variant">
                                ⌘K
                            </kbd>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 hover:border-primary/40 transition-colors">
                        <IconBadge name="smartphone" />
                        <span>{t("strip.pwa")}</span>
                    </div>
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-surface-container-lowest to-transparent md:hidden" />
            </section>

            {/* 4. FEATURE OVERVIEW */}
            <section
                className="py-24 px-4 sm:px-6 lg:px-8 bg-surface"
                id="recursos"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <SectionHeader
                            badge={t("features.badge")}
                            title={t("features.title")}
                            subtitle={t("features.subtitle")}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <Reveal delay={0}>
                            <FeatureCard
                                icon="bolt"
                                title={t("features.realtimeTitle")}
                                description={t("features.realtimeDescription")}
                            />
                        </Reveal>

                        {/* Card 2 */}
                        <Reveal delay={100}>
                            <FeatureCard
                                icon="groups"
                                title={t("features.groupsTitle")}
                                description={t("features.groupsDescription")}
                            />
                        </Reveal>

                        {/* Card 3 */}
                        <Reveal delay={200}>
                            <FeatureCard
                                icon="video_call"
                                title={t("features.callsTitle")}
                                description={t("features.callsDescription")}
                            />
                        </Reveal>

                        {/* Card 4 */}
                        <Reveal delay={300}>
                            <FeatureCard
                                icon="cloud_upload"
                                title={t("features.filesTitle")}
                                description={t("features.filesDescription")}
                            />
                        </Reveal>

                        {/* Card 5 */}
                        <Reveal delay={400}>
                            <FeatureCard
                                icon="push_pin"
                                title={t("features.organizeTitle")}
                                description={t("features.organizeDescription")}
                            />
                        </Reveal>

                        {/* Card 6 */}
                        <Reveal delay={500}>
                            <FeatureCard
                                icon="search"
                                title={t("features.searchTitle")}
                                description={t("features.searchDescription")}
                            />
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* 5. REAL-TIME MESSAGING SECTION (Visual Left + Text Right) */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-container-lowest/80 border-t border-outline-variant/50">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left: Rich Chat UI Mockup */}
                    <div className="lg:col-span-7 order-2 lg:order-1">
                        <Reveal>
                            <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-outline-variant">
                                <div className="grid grid-cols-12 min-h-115">
                                    {/* Sidebar preview */}
                                    <div className="col-span-4 bg-surface-container-low border-r border-outline-variant/60 p-3 hidden sm:flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-outline">
                                                {t("chatMockup.conversations")}
                                            </div>
                                            {/* Contact: Caique */}
                                            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-high/40 hover:bg-surface-container-high transition-colors cursor-pointer">
                                                <div className="relative">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-900/60 text-primary flex items-center justify-center font-bold text-xs">
                                                        C
                                                    </div>
                                                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-primary border-2 border-surface-container-low" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-on-surface truncate">
                                                        caique
                                                    </p>
                                                    <p className="text-[10px] text-on-surface-variant truncate">
                                                        {t(
                                                            "chatMockup.contact1Message",
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Contact: Teste (Active) */}
                                            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-primary/15 border border-primary/30 transition-colors cursor-pointer">
                                                <div className="relative">
                                                    <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                                                        T
                                                    </div>
                                                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-primary border-2 border-surface-container-low" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-primary truncate">
                                                        teste
                                                    </p>
                                                    <p className="text-[10px] text-primary/80 truncate">
                                                        {t("chatMockup.typing")}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Contact: Dev Team Convo */}
                                            <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer">
                                                <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-bold text-xs">
                                                    #
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-on-surface truncate">
                                                        Dev Team Convo
                                                    </p>
                                                    <p className="text-[10px] text-on-surface-variant truncate">
                                                        {t(
                                                            "chatMockup.contact3Message",
                                                        )}
                                                    </p>
                                                </div>
                                                <span className="w-4 h-4 rounded-full bg-primary text-on-primary-container text-[10px] font-bold flex items-center justify-center">
                                                    2
                                                </span>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-outline-variant/40 flex items-center gap-2 px-1">
                                            <span className="w-2 h-2 rounded-full bg-primary" />
                                            <span className="text-[11px] text-on-surface-variant">
                                                ConvoTalk
                                            </span>
                                        </div>
                                    </div>

                                    {/* Active Chat Pane */}
                                    <div className="col-span-12 sm:col-span-8 flex flex-col justify-between bg-surface-container-lowest">
                                        {/* Header */}
                                        <div className="p-3 border-b border-outline-variant/50 flex items-center justify-between bg-surface-container/50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                                                    T
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-on-surface">
                                                        teste
                                                    </h4>
                                                    <p className="text-[10px] text-primary flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                        {t("chatMockup.online")}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Pinned message badge */}
                                            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant">
                                                <Icon
                                                    name="push_pin"
                                                    className="text-[13px] text-primary"
                                                />
                                                <span>
                                                    {t("chatMockup.pinned")}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Messages Area */}
                                        <div className="p-4 space-y-3.5 text-xs">
                                            {/* Inbound message with reply */}
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="bg-surface-container-high border border-outline-variant rounded-xl rounded-tl-sm p-3 max-w-[85%]">
                                                    <div className="text-[10px] text-primary font-medium mb-1 flex items-center gap-1">
                                                        <Icon name="lock" className="text-[12px]" />
                                                        <span>
                                                            {t(
                                                                "chatMockup.secure",
                                                            )}
                                                        </span>
                                                    </div>
                                                    <p className="text-on-surface">
                                                        {t(
                                                            "chatMockup.message1",
                                                        )}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-outline-variant/30 text-[10px] text-on-surface-variant">
                                                        <span>14:02</span>
                                                        {/* Reactions */}
                                                        <div className="flex items-center gap-1 bg-surface-container px-1.5 py-0.5 rounded-full border border-outline-variant">
                                                            <span>👍</span>
                                                            <span>🔥</span>
                                                            <span className="text-[9px] text-primary font-bold">
                                                                2
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Outbound message */}
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="bg-primary-container/25 border border-primary/40 rounded-xl rounded-tr-sm p-3 max-w-[85%] text-on-surface">
                                                    <p>
                                                        {t(
                                                            "chatMockup.message2",
                                                        )}
                                                    </p>
                                                    <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-primary">
                                                        <span>14:03</span>
                                                        <span className="font-bold">
                                                            {t(
                                                                "chatMockup.read",
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Typing Indicator */}
                                            <div className="flex items-center gap-2 text-[11px] text-on-surface-variant italic pt-2">
                                                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-surface-container-high border border-outline-variant">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary bounce-1" />
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary bounce-2" />
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary bounce-3" />
                                                </div>
                                                <span>
                                                    {t(
                                                        "chatMockup.typingIndicator",
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Input footer */}
                                        <div className="p-3 border-t border-outline-variant/50 bg-surface-container/60 flex items-center gap-2">
                                            <input
                                                className="bg-surface-container-high border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-on-surface flex-1 focus:outline-none focus:border-primary"
                                                placeholder={t(
                                                    "chatMockup.inputPlaceholder",
                                                )}
                                                readOnly
                                                type="text"
                                                defaultValue={t(
                                                    "chatMockup.draft",
                                                )}
                                            />
                                            <div className="bg-primary text-on-primary-container p-1.5 rounded-lg flex items-center justify-center">
                                                <Icon name="send" className="text-[16px]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* Right: Text Content */}
                    <div className="lg:col-span-5 order-1 lg:order-2 space-y-6">
                        <Reveal>
                            <SectionHeader
                                badge={t("messaging.badge")}
                                title={t("messaging.title")}
                                subtitle={t("messaging.subtitle")}
                                align="left"
                            />
                        </Reveal>

                        <div className="space-y-3 pt-2">
                            {[
                                "messaging.list1",
                                "messaging.list2",
                                "messaging.list3",
                                "messaging.list4",
                                "messaging.list5",
                                "messaging.list6",
                                "messaging.list7",
                            ].map((feature, idx) => (
                                <Reveal key={feature} delay={idx * 60}>
                                    <div className="flex items-center gap-3 text-sm text-on-surface">
                                        <IconBadge
                                            name="check_circle"
                                            size="lg"
                                        />
                                        <span>{t(feature)}</span>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. AUDIO & VIDEO CALLS (Text Left + Visual Right) */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left: Text */}
                    <div className="lg:col-span-5 space-y-6">
                        <Reveal>
                            <SectionHeader
                                badge={t("calls.badge")}
                                title={t("calls.title")}
                                subtitle={t("calls.subtitle")}
                                align="left"
                            />
                        </Reveal>

                        <div className="space-y-4 pt-2">
                            <Reveal delay={100}>
                                <div className="flex items-start gap-3.5 p-3 rounded-lg bg-surface-container-low border border-outline-variant/60">
                                    <IconBadge name="mic" size="lg" />
                                    <div>
                                        <h4 className="text-sm font-bold text-on-surface">
                                            {t("calls.audioTitle")}
                                        </h4>
                                        <p className="text-xs text-on-surface-variant mt-0.5">
                                            {t("calls.audioDescription")}
                                        </p>
                                    </div>
                                </div>
                            </Reveal>

                            <Reveal delay={200}>
                                <div className="flex items-start gap-3.5 p-3 rounded-lg bg-surface-container-low border border-outline-variant/60">
                                    <IconBadge name="videocam" size="lg" />
                                    <div>
                                        <h4 className="text-sm font-bold text-on-surface">
                                            {t("calls.videoTitle")}
                                        </h4>
                                        <p className="text-xs text-on-surface-variant mt-0.5">
                                            {t("calls.videoDescription")}
                                        </p>
                                    </div>
                                </div>
                            </Reveal>

                            <Reveal delay={300}>
                                <div className="flex items-start gap-3.5 p-3 rounded-lg bg-surface-container-low border border-outline-variant/60">
                                    <IconBadge name="settings" size="lg" />
                                    <div>
                                        <h4 className="text-sm font-bold text-on-surface">
                                            {t("calls.controlsTitle")}
                                        </h4>
                                        <p className="text-xs text-on-surface-variant mt-0.5">
                                            {t("calls.controlsDescription")}
                                        </p>
                                    </div>
                                </div>
                            </Reveal>
                        </div>
                    </div>

                    {/* Right: High-Fidelity Video Call Mockup */}
                    <div className="lg:col-span-7">
                        <Reveal>
                            <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-primary/30 relative">
                                {/* Main video area */}
                                <div className="relative bg-linear-to-b from-surface-container-low to-surface-container-lowest h-96 flex flex-col justify-between p-6">
                                    {/* Participant Video Simulated Center */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <div className="w-24 h-24 rounded-full bg-linear-to-tr from-primary-container to-primary flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_40px_rgba(89,224,123,0.3)]">
                                            P
                                        </div>
                                        {/* Audio wave animation */}
                                        <div className="flex items-center gap-1.5 mt-4">
                                            <span className="w-1 h-5 bg-primary rounded-full animate-pulse" />
                                            <span
                                                className="w-1 h-8 bg-primary rounded-full animate-pulse"
                                                style={{
                                                    animationDelay: "0.15s",
                                                }}
                                            />
                                            <span
                                                className="w-1 h-3 bg-primary rounded-full animate-pulse"
                                                style={{
                                                    animationDelay: "0.3s",
                                                }}
                                            />
                                            <span
                                                className="w-1 h-7 bg-primary rounded-full animate-pulse"
                                                style={{
                                                    animationDelay: "0.45s",
                                                }}
                                            />
                                            <span
                                                className="w-1 h-4 bg-primary rounded-full animate-pulse"
                                                style={{
                                                    animationDelay: "0.2s",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Top meta bar */}
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="flex items-center gap-2 bg-surface-container-lowest/80 backdrop-blur px-3 py-1.5 rounded-lg border border-outline-variant/60 text-xs">
                                            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                                            <span className="font-bold text-on-surface">
                                                Paulo
                                            </span>
                                            <span className="text-outline-variant">
                                                •
                                            </span>
                                            <span className="text-primary font-mono">
                                                1080p 60fps
                                            </span>
                                        </div>
                                        <div className="text-xs font-mono text-on-surface-variant bg-surface-container-lowest/80 px-2.5 py-1 rounded-md border border-outline-variant/60">
                                            09:42
                                        </div>
                                    </div>

                                    {/* Picture in Picture self view */}
                                    <div className="absolute top-6 right-6 z-20 w-32 h-24 rounded-xl bg-surface-container-high border-2 border-primary/50 overflow-hidden shadow-lg flex flex-col items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                                            VC
                                        </div>
                                        <span className="text-[10px] text-on-surface font-medium mt-1">
                                            {t("calls.self")}
                                        </span>
                                    </div>

                                    {/* Floating Call Control Bar */}
                                    <div className="relative z-20 self-center bg-surface-container/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-outline-variant flex items-center gap-4 shadow-xl">
                                        <button
                                            type="button"
                                            aria-label={t("calls.mic")}
                                            className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
                                        >
                                            <Icon name="mic" className="text-[20px]" />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={t("calls.camera")}
                                            className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
                                        >
                                            <Icon name="videocam" className="text-[20px]" />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={t("calls.shareScreen")}
                                            className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
                                        >
                                            <Icon name="screen_share" className="text-[20px]" />
                                        </button>
                                        <div className="w-px h-6 bg-outline-variant" />
                                        <button
                                            type="button"
                                            aria-label={t("calls.hangUp")}
                                            className="w-10 h-10 rounded-full bg-error-container hover:bg-red-700 flex items-center justify-center text-white transition-colors shadow-[0_0_15px_rgba(255,100,100,0.3)] cursor-pointer"
                                        >
                                            <Icon name="call_end" className="text-[20px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* 7. GROUPS & COMMUNITY (Large Centered Visual) */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-container-lowest border-t border-outline-variant/50">
                <div className="max-w-6xl mx-auto text-center">
                    <Reveal>
                        <SectionHeader
                            badge={t("groups.badge")}
                            title={t("groups.title")}
                            subtitle={t("groups.subtitle")}
                        />
                    </Reveal>

                    {/* Group Management Mockup */}
                    <Reveal delay={100}>
                        <div className="mt-12 glass-card rounded-2xl border border-outline-variant overflow-hidden text-left shadow-2xl">
                            {/* Group Header */}
                            <div className="p-4 bg-surface-container-low border-b border-outline-variant/60 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-container/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-base">
                                        #
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-base text-on-surface">
                                                Dev Team Convo
                                            </h3>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary border border-primary/30">
                                                {t("groups.publicChannel")}
                                            </span>
                                        </div>
                                        <p className="text-xs text-on-surface-variant">
                                            {t("groups.membersOnline")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-container-high border border-outline-variant text-on-surface">
                                        {t("groups.rules")}
                                    </span>
                                    <button
                                        type="button"
                                        className="bg-primary text-on-primary-container text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1 cursor-pointer hover:bg-primary-fixed transition-colors"
                                    >
                                        <Icon name="person_add" className="text-[15px]" />
                                        <span>{t("groups.invite")}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Pinned Announcement Banner */}
                            <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center gap-2 text-xs text-on-surface">
                                <Icon name="campaign" className="text-primary text-[16px]" />
                                <span className="font-semibold text-primary">
                                    {t("groups.pinnedAnnouncement")}
                                </span>
                                <span className="text-on-surface-variant">
                                    {t("groups.announcement")}
                                </span>
                            </div>

                            {/* Group Content Viewport */}
                            <div className="grid grid-cols-1 md:grid-cols-12 min-h-65">
                                {/* Active Chat / Discussion */}
                                <div className="md:col-span-8 p-6 space-y-4 bg-surface-container-lowest">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/30 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                                            L
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-on-surface">
                                                    Lucas (Lead)
                                                </span>
                                                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.2 rounded font-mono">
                                                    {t("groups.admin")}
                                                </span>
                                                <span className="text-[10px] text-on-surface-variant">
                                                    11:20
                                                </span>
                                            </div>
                                            <p className="text-xs text-on-surface mt-1">
                                                {t("groups.message1")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-secondary-container text-white font-bold flex items-center justify-center text-xs shrink-0">
                                            M
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-on-surface">
                                                    Marina
                                                </span>
                                                <span className="text-[10px] bg-outline-variant text-on-surface-variant px-1.5 py-0.2 rounded font-mono">
                                                    {t("groups.member")}
                                                </span>
                                                <span className="text-[10px] text-on-surface-variant">
                                                    11:22
                                                </span>
                                            </div>
                                            <p className="text-xs text-on-surface mt-1">
                                                {t("groups.message2")}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side Panel: Participants */}
                                <div className="md:col-span-4 bg-surface-container-low/60 border-l border-outline-variant/60 p-4 space-y-3">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-outline">
                                        {t("groups.participants")}
                                    </div>
                                    <div className="flex items-center justify-between text-xs py-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-primary" />
                                            <span className="text-on-surface font-medium">
                                                Lucas (Lead)
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-primary">
                                            {t("groups.admin")}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs py-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-primary" />
                                            <span className="text-on-surface font-medium">
                                                Marina Costa
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-on-surface-variant">
                                            {t("groups.moderator")}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs py-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-primary" />
                                            <span className="text-on-surface font-medium">
                                                Caique Dev
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-on-surface-variant">
                                            {t("groups.member")}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs py-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-outline" />
                                            <span className="text-on-surface-variant">
                                                Rodrigo Alves
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-outline">
                                            {t("groups.away")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Reveal>

                    {/* 3 Key Features below */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 text-left">
                        <Reveal delay={100}>
                            <div className="glass-card p-5 rounded-xl h-full">
                                <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold mb-3">
                                    <Icon name="admin_panel_settings" className="text-lg" />
                                </div>
                                <h4 className="text-base font-bold text-on-surface mb-1">
                                    {t("groups.membersPermissionsTitle")}
                                </h4>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    {t("groups.membersPermissionsText")}
                                </p>
                            </div>
                        </Reveal>

                        <Reveal delay={200}>
                            <div className="glass-card p-5 rounded-xl h-full">
                                <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold mb-3">
                                    <Icon name="notifications" className="text-lg" />
                                </div>
                                <h4 className="text-base font-bold text-on-surface mb-1">
                                    {t("groups.notificationsTitle")}
                                </h4>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    {t("groups.notificationsText")}
                                </p>
                            </div>
                        </Reveal>

                        <Reveal delay={300}>
                            <div className="glass-card p-5 rounded-xl h-full">
                                <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold mb-3">
                                    <Icon name="badge" className="text-lg" />
                                </div>
                                <h4 className="text-base font-bold text-on-surface mb-1">
                                    {t("groups.profilesTitle")}
                                </h4>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    {t("groups.profilesText")}
                                </p>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* 8. FILE SHARING & ORGANIZATION (Visual Left + Text Right) */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left: Files Mockup */}
                    <div className="lg:col-span-6 space-y-4">
                        <Reveal>
                            {/* PDF Document Card */}
                            <div className="glass-card p-4 rounded-xl border border-outline-variant hover:border-primary/40 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-error-container/30 border border-error/40 flex items-center justify-center text-error">
                                        <Icon name="picture_as_pdf" className="text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm font-bold text-on-surface">
                                            relatorio_arquitetura_v2.pdf
                                        </p>
                                        <p className="text-[11px] text-on-surface-variant">
                                            {t("files.pdfSentBy")}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="p-2 rounded-lg bg-surface-container-high hover:bg-primary-container text-on-surface hover:text-white transition-colors cursor-pointer"
                                    title={t("files.download")}
                                >
                                    <Icon name="download" className="text-[18px]" />
                                </button>
                            </div>
                        </Reveal>

                        <Reveal delay={100}>
                            {/* Voice Audio Player Card */}
                            <div className="glass-card p-4 rounded-xl border border-outline-variant space-y-2">
                                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                                    <span className="flex items-center gap-1 text-primary font-semibold">
                                        <Icon
                                            name="graphic_eq"
                                            className="text-[16px]"
                                        />
                                        {t("files.audioMessage")}
                                    </span>
                                    <span className="font-mono">0:42</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        aria-label={t("files.playAudio")}
                                        className="w-9 h-9 rounded-full bg-primary text-on-primary-container flex items-center justify-center shrink-0 cursor-pointer"
                                    >
                                        <Icon name="play_arrow" filled className="text-[20px]" />
                                    </button>
                                    {/* Simulated Waveform */}
                                    <div className="flex-1 flex items-center gap-1 h-6">
                                        <div className="h-3 w-1 bg-primary rounded-full" />
                                        <div className="h-5 w-1 bg-primary rounded-full" />
                                        <div className="h-6 w-1 bg-primary rounded-full" />
                                        <div className="h-4 w-1 bg-primary rounded-full" />
                                        <div className="h-2 w-1 bg-primary rounded-full" />
                                        <div className="h-5 w-1 bg-primary-container rounded-full" />
                                        <div className="h-7 w-1 bg-primary-container rounded-full" />
                                        <div className="h-3 w-1 bg-outline rounded-full" />
                                        <div className="h-5 w-1 bg-outline rounded-full" />
                                        <div className="h-2 w-1 bg-outline rounded-full" />
                                        <div className="h-4 w-1 bg-outline rounded-full" />
                                        <div className="h-6 w-1 bg-outline rounded-full" />
                                        <div className="h-3 w-1 bg-outline rounded-full" />
                                        <div className="h-2 w-1 bg-outline rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </Reveal>

                        <Reveal delay={200}>
                            {/* Code snippet block */}
                            <div className="glass-card rounded-xl border border-outline-variant overflow-hidden">
                                <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant/60 flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                                    <span>socket.handler.ts</span>
                                    <span className="text-primary font-bold">
                                        TypeScript
                                    </span>
                                </div>
                                <pre className="p-4 text-xs font-mono text-on-surface bg-surface-container-lowest/80 overflow-x-auto leading-relaxed">
                                    <code>{`socket.on('message:send', async (payload) => {
  const validated = MessageSchema.parse(payload);
  await messageService.dispatch(validated);
  io.to(validated.roomId).emit('message:delivered', validated);
});`}</code>
                                </pre>
                            </div>
                        </Reveal>
                    </div>

                    {/* Right: Text Content */}
                    <div className="lg:col-span-6 space-y-6">
                        <Reveal>
                            <SectionHeader
                                badge={t("files.badge")}
                                title={t("files.title")}
                                subtitle={t("files.subtitle")}
                                align="left"
                            />
                        </Reveal>

                        <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm text-on-surface">
                            <Reveal delay={100}>
                                <div className="flex items-center gap-2">
                                    <IconBadge name="photo_camera" />
                                    <span>{t("files.images")}</span>
                                </div>
                            </Reveal>
                            <Reveal delay={150}>
                                <div className="flex items-center gap-2">
                                    <IconBadge name="description" />
                                    <span>{t("files.documents")}</span>
                                </div>
                            </Reveal>
                            <Reveal delay={200}>
                                <div className="flex items-center gap-2">
                                    <IconBadge name="music_note" />
                                    <span>{t("files.audio")}</span>
                                </div>
                            </Reveal>
                            <Reveal delay={250}>
                                <div className="flex items-center gap-2">
                                    <IconBadge name="attach_file" />
                                    <span>{t("files.archives")}</span>
                                </div>
                            </Reveal>
                        </div>

                        {/* Special feature callout box */}
                        <Reveal delay={300}>
                            <div className="p-4 rounded-xl bg-surface-container-high/60 border border-primary/30 flex items-start gap-3">
                                <IconBadge name="folder_open" size="xl" />
                                <div className="text-xs sm:text-sm">
                                    <span className="font-bold text-primary">
                                        {t("files.exportTitle")}
                                    </span>
                                    <p className="text-on-surface-variant mt-1 leading-relaxed">
                                        {t("files.exportText")}
                                    </p>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* 9. OFFLINE / PWA */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-container-lowest border-t border-outline-variant/50">
                <div className="max-w-7xl mx-auto text-center">
                    <Reveal>
                        <SectionHeader
                            badge={t("pwa.badge")}
                            title={t("pwa.title")}
                            subtitle={t("pwa.subtitle")}
                        />
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 text-left">
                        {/* Card 1 */}
                        <Reveal delay={100}>
                            <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/40 transition flex flex-col justify-between h-full">
                                <div>
                                    <div className="w-12 h-12 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary mb-4">
                                        <Icon name="install_desktop" className="text-2xl" />
                                    </div>
                                    <h3 className="text-lg font-bold text-on-surface mb-2">
                                        {t("pwa.installTitle")}
                                    </h3>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        {t("pwa.installText")}
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-outline-variant/40 flex items-center gap-2 text-xs text-primary font-semibold">
                                    <Icon name="devices" className="text-[16px]" />
                                    <span>{t("pwa.installFooter")}</span>
                                </div>
                            </div>
                        </Reveal>

                        {/* Card 2 */}
                        <Reveal delay={200}>
                            <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/40 transition flex flex-col justify-between h-full">
                                <div>
                                    <div className="w-12 h-12 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary mb-4">
                                        <Icon name="database" className="text-2xl" />
                                    </div>
                                    <h3 className="text-lg font-bold text-on-surface mb-2">
                                        {t("pwa.offlineTitle")}
                                    </h3>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        {t("pwa.offlineText")}
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-outline-variant/40 flex items-center gap-2 text-xs text-primary font-semibold">
                                    <Icon name="cloud_off" className="text-[16px]" />
                                    <span>{t("pwa.offlineFooter")}</span>
                                </div>
                            </div>
                        </Reveal>

                        {/* Card 3 */}
                        <Reveal delay={300}>
                            <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/40 transition flex flex-col justify-between h-full">
                                <div>
                                    <div className="w-12 h-12 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary mb-4">
                                        <Icon name="sync" className="text-2xl" />
                                    </div>
                                    <h3 className="text-lg font-bold text-on-surface mb-2">
                                        {t("pwa.queueTitle")}
                                    </h3>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        {t("pwa.queueText")}
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-outline-variant/40 flex items-center gap-2 text-xs text-primary font-semibold">
                                    <Icon name="schedule_send" className="text-[16px]" />
                                    <span>{t("pwa.queueFooter")}</span>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* 10. SECURITY */}
            <section
                className="py-24 px-4 sm:px-6 lg:px-8 bg-surface"
                id="seguranca"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <Reveal>
                            <SectionHeader
                                badge={t("security.badge")}
                                title={t("security.title")}
                                subtitle={t("security.subtitle")}
                            />
                        </Reveal>
                    </div>

                    {/* 2x2 Security Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        {/* Sec Card 1 */}
                        <Reveal delay={100}>
                            <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/40 transition-colors h-full">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl">
                                        <IconBadge name="lock" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-on-surface">
                                        {t("security.authTitle")}
                                    </h3>
                                </div>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    {t("security.authText")}
                                </p>
                            </div>
                        </Reveal>

                        {/* Sec Card 2 */}
                        <Reveal delay={200}>
                            <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/40 transition-colors h-full">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl">
                                        <IconBadge name="shield" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-on-surface">
                                        {t("security.abuseTitle")}
                                    </h3>
                                </div>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    {t("security.abuseText")}
                                </p>
                            </div>
                        </Reveal>

                        {/* Sec Card 3 */}
                        <Reveal delay={300}>
                            <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/40 transition-colors h-full">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl">
                                        <IconBadge name="check" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-on-surface">
                                        {t("security.validationTitle")}
                                    </h3>
                                </div>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    {t("security.validationText")}
                                </p>
                            </div>
                        </Reveal>

                        {/* Sec Card 4 */}
                        <Reveal delay={400}>
                            <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/40 transition-colors h-full">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl">
                                        <IconBadge name="language" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-on-surface">
                                        {t("security.secureCommsTitle")}
                                    </h3>
                                </div>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    {t("security.secureCommsText")}
                                </p>
                            </div>
                        </Reveal>
                    </div>

                    {/* Bottom Pill */}
                    <Reveal delay={500}>
                        <div className="mt-10 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-high border border-outline-variant text-xs text-on-surface font-medium">
                                <IconBadge name="verified" />
                                <span>{t("security.filesNote")}</span>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* 11. TECHNOLOGY / ARCHITECTURE */}
            <section
                className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-container-lowest border-t border-outline-variant/50"
                id="arquitetura"
            >
                <div className="max-w-6xl mx-auto text-center">
                    <Reveal>
                        <SectionHeader
                            badge={t("architecture.badge")}
                            title={t("architecture.title")}
                            subtitle={t("architecture.subtitle")}
                        />
                    </Reveal>

                    {/* Architecture Diagram Flow */}
                    <Reveal delay={100}>
                        <div className="mt-14 max-w-4xl mx-auto glass-card p-8 rounded-2xl border border-outline-variant relative">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
                                {/* Node 1: Client */}
                                <div className="flex-1 w-full p-5 rounded-xl bg-surface-container border border-outline-variant text-left hover:border-primary/40 transition-colors">
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
                                        <Icon name="devices" className="text-[18px]" />
                                        <span>
                                            {t("architecture.frontend")}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm text-on-surface">
                                        {t("architecture.frontendTitle")}
                                    </h4>
                                    <p className="text-xs text-on-surface-variant mt-1">
                                        {t("architecture.frontendText")}
                                    </p>
                                </div>

                                {/* Connector 1 */}
                                <div className="flex flex-col items-center justify-center text-primary font-mono text-[11px] py-2 md:py-0 px-2">
                                    <span className="hidden md:block">⇆</span>
                                    <span className="md:hidden">⇅</span>
                                    <span className="text-[10px] text-on-surface-variant font-sans text-center">
                                        {t("architecture.wss")}
                                    </span>
                                </div>

                                {/* Node 2: Gateway & API */}
                                <div className="flex-1 w-full p-5 rounded-xl bg-surface-container border border-outline-variant text-left hover:border-primary/40 transition-colors">
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
                                        <Icon name="dns" className="text-[18px]" />
                                        <span>{t("architecture.gateway")}</span>
                                    </div>
                                    <h4 className="font-bold text-sm text-on-surface">
                                        {t("architecture.gatewayTitle")}
                                    </h4>
                                    <p className="text-xs text-on-surface-variant mt-1">
                                        {t("architecture.gatewayText")}
                                    </p>
                                </div>

                                {/* Connector 2 */}
                                <div className="flex flex-col items-center justify-center text-primary font-mono text-[11px] py-2 md:py-0 px-2">
                                    <span className="hidden md:block">⇆</span>
                                    <span className="md:hidden">⇅</span>
                                    <span className="text-[10px] text-on-surface-variant font-sans text-center">
                                        {t("architecture.connectionPool")}
                                    </span>
                                </div>

                                {/* Node 3: Database & Storage */}
                                <div className="flex-1 w-full p-5 rounded-xl bg-surface-container border border-outline-variant text-left hover:border-primary/40 transition-colors">
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
                                        <Icon name="database" className="text-[18px]" />
                                        <span>
                                            {t("architecture.database")}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm text-on-surface">
                                        {t("architecture.databaseTitle")}
                                    </h4>
                                    <p className="text-xs text-on-surface-variant mt-1">
                                        {t("architecture.databaseText")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Reveal>

                    {/* Tech Badges */}
                    <Reveal delay={200}>
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
                            <span className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-container-high border border-outline-variant text-on-surface">
                                React 19
                            </span>
                            <span className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-container-high border border-outline-variant text-on-surface">
                                TypeScript
                            </span>
                            <span className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-container-high border border-outline-variant text-on-surface">
                                Node.js
                            </span>
                            <span className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-container-high border border-outline-variant text-on-surface">
                                Express
                            </span>
                            <span className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-container-high border border-outline-variant text-on-surface">
                                MongoDB
                            </span>
                            <span className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary-container/20 border border-primary/40 text-primary font-mono">
                                Socket.IO
                            </span>
                            <span className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary-container/20 border border-primary/40 text-primary font-mono">
                                WebRTC
                            </span>
                            <span className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-container-high border border-outline-variant text-on-surface">
                                Tailwind CSS
                            </span>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* 12. HOW IT WORKS (Timeline) */}
            <section
                className="py-24 px-4 sm:px-6 lg:px-8 bg-surface"
                id="como-funciona"
            >
                <div className="max-w-7xl mx-auto text-center">
                    <Reveal>
                        <SectionHeader
                            badge={t("howItWorks.badge")}
                            title={t("howItWorks.title")}
                            subtitle={t("howItWorks.subtitle")}
                        />
                    </Reveal>

                    {/* Timeline with connecting glowing line */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Desktop Line */}
                        <div className="hidden md:block absolute top-8 left-[18%] right-[18%] h-0.5 bg-linear-to-r from-primary-container via-primary to-primary-container z-0 opacity-40" />

                        {/* Step 01 */}
                        <Reveal delay={100}>
                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-primary flex items-center justify-center text-primary font-bold text-xl mb-6 shadow-[0_0_20px_rgba(89,224,123,0.3)]">
                                    01
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    {t("howItWorks.step1Title")}
                                </h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
                                    {t("howItWorks.step1Text")}
                                </p>
                            </div>
                        </Reveal>

                        {/* Step 02 */}
                        <Reveal delay={200}>
                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-primary flex items-center justify-center text-primary font-bold text-xl mb-6 shadow-[0_0_20px_rgba(89,224,123,0.3)]">
                                    02
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    {t("howItWorks.step2Title")}
                                </h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
                                    {t("howItWorks.step2Text")}
                                </p>
                            </div>
                        </Reveal>

                        {/* Step 03 */}
                        <Reveal delay={300}>
                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-primary flex items-center justify-center text-primary font-bold text-xl mb-6 shadow-[0_0_20px_rgba(89,224,123,0.3)]">
                                    03
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    {t("howItWorks.step3Title")}
                                </h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
                                    {t("howItWorks.step3Text")}
                                </p>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* 13. FAQ (Interactive Accordion) */}
            <section
                id="perguntas-frequentes"
                className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-container-lowest border-t border-outline-variant/50"
            >
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <Reveal>
                            <SectionHeader
                                badge={t("faq.badge")}
                                title={t("faq.title")}
                                subtitle={t("faq.subtitle")}
                            />
                        </Reveal>
                    </div>

                    {/* Accordion Items */}
                    <div className="space-y-4">
                        {FAQ_ITEMS.map((faq, index) => {
                            const isOpen = openFaq === index;
                            const panelId = `faq-panel-${index}`;
                            const buttonId = `faq-button-${index}`;
                            return (
                                <Reveal key={index} delay={index * 50}>
                                    <div className="glass-card rounded-xl border border-outline-variant/70 overflow-hidden transition-colors">
                                        <h3 className="m-0">
                                            <button
                                                type="button"
                                                id={buttonId}
                                                aria-expanded={isOpen}
                                                aria-controls={panelId}
                                                onClick={() => toggleFaq(index)}
                                                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:text-primary transition-colors focus:outline-none cursor-pointer"
                                            >
                                                <span className="font-bold text-sm sm:text-base text-on-surface">
                                                    {t(`faq.q${faq}`)}
                                                </span>
                                                <Icon name="expand_more" />
                                            </button>
                                        </h3>
                                        {/* Collapsed visually, not with `hidden`:
                                            the answers stay readable to
                                            crawlers and assistive tech. */}
                                        <div
                                            id={panelId}
                                            role="region"
                                            aria-labelledby={buttonId}
                                            className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                                                isOpen
                                                    ? "max-h-[32rem] opacity-100"
                                                    : "max-h-0 opacity-0"
                                            }`}
                                        >
                                            <p className="px-5 pb-5 text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/30 pt-3">
                                                {t(`faq.a${faq}`)}
                                            </p>
                                        </div>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 14. FINAL CTA */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-surface">
                <div className="max-w-5xl mx-auto relative">
                    <Reveal>
                        <div className="glass-card p-10 sm:p-16 rounded-3xl border border-primary/40 relative overflow-hidden text-center shadow-[0_0_50px_rgba(0,168,75,0.15)]">
                            {/* Glow decoration */}
                            <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-primary-container/20 rounded-full blur-[100px] pointer-events-none" />

                            <div className="relative z-10">
                                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-on-surface mb-6">
                                    {t("cta.title")}
                                </h2>
                                <p className="text-base sm:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
                                    {t("cta.subtitle")}
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <LocalizedLink
                                        to="/login?mode=register"
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-linear-to-r from-primary-container to-primary text-white px-8 py-4 rounded-xl font-bold text-sm shadow-[0_0_30px_rgba(0,168,75,0.5)] hover:shadow-[0_0_40px_rgba(89,224,123,0.7)] hover:-translate-y-0.5 transition"
                                    >
                                        <span>{t("cta.start")}</span>
                                        <Icon name="arrow_forward" className="text-lg" />
                                    </LocalizedLink>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* 15. FOOTER */}
            <footer className="w-full bg-surface-container-low border-t border-outline-variant/60 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Top Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-outline-variant/40">
                        {/* Brand column */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center gap-2">
                                <img
                                    src="/logo-192.webp" width={192} height={163}
                                    alt="ConvoTalk"
                                    className="h-7 w-auto object-contain"
                                />
                                <span className="text-xl font-bold text-primary tracking-tight font-hanken">
                                    ConvoTalk
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-sm">
                                {t("footer.tagline")}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-primary font-medium">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span>{t("footer.systems")}</span>
                            </div>
                        </div>

                        {/* Nav Column 1: Produto */}
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                                {t("footer.product")}
                            </h2>
                            <ul className="space-y-2 text-xs sm:text-sm text-on-surface-variant">
                                <li>
                                    <a
                                        className="hover:text-primary transition-colors"
                                        href="#recursos"
                                    >
                                        {t("nav.features")}
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Nav Column 2: Plataforma */}
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                                {t("footer.platform")}
                            </h2>
                            <ul className="space-y-2 text-xs sm:text-sm text-on-surface-variant">
                                <li>
                                    <a
                                        className="hover:text-primary transition-colors"
                                        href="#como-funciona"
                                    >
                                        {t("nav.howItWorks")}
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="hover:text-primary transition-colors"
                                        href="#arquitetura"
                                    >
                                        {t("nav.architecture")}
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="hover:text-primary transition-colors"
                                        href="#seguranca"
                                    >
                                        {t("nav.security")}
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="hover:text-primary transition-colors"
                                        href="#perguntas-frequentes"
                                    >
                                        {t("footer.faq")}
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Nav Column 4: Legal */}
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                                {t("footer.legal")}
                            </h2>
                            <ul className="space-y-2 text-xs sm:text-sm text-on-surface-variant">
                                <li>
                                    <LocalizedLink
                                        className="hover:text-primary transition-colors"
                                        to="/privacy"
                                    >
                                        {t("footer.privacy")}
                                    </LocalizedLink>
                                </li>
                                <li>
                                    <LocalizedLink
                                        className="hover:text-primary transition-colors"
                                        to="/terms"
                                    >
                                        {t("footer.terms")}
                                    </LocalizedLink>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
                        <p>
                            {t("footer.rights", {
                                year: new Date().getFullYear(),
                            })}
                        </p>
                        <p className="flex items-center gap-2">
                            <span>{t("footer.builtWith")}</span>
                            <span className="text-primary font-semibold">
                                Socket.IO
                            </span>
                            <span>{t("footer.and")}</span>
                            <span className="text-primary font-semibold">
                                WebRTC
                            </span>
                        </p>
                    </div>
                </div>
            </footer>

            <BackToTop visible={showBackToTop} />
        </div>
    );
}
