import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import PreviewChat from "../components/Home/PreviewChat";
import Navbar from "../components/Home/Navbar";
import BackToTop from "../components/Home/BackToTop";
import Reveal from "../components/ui/Reveal";
import SEO from "../components/SEO";
import { useScrollSpy } from "../hooks/useScrollSpy";

const FAQ_ITEMS = [
    {
        question: "O ConvoTalk é gratuito?",
        answer: "Sim! O ConvoTalk oferece planos gratuitos para uso individual e soluções corporativas seguras e privadas para equipes de qualquer porte.",
    },
    {
        question: "Preciso criar uma conta para usar?",
        answer: "Você pode experimentar demonstrações públicas instantaneamente, mas para ter histórico persistente e gerenciar grupos basta criar uma conta em menos de 1 minuto.",
    },
    {
        question: "Posso fazer chamadas de vídeo?",
        answer: "Sim, o ConvoTalk integra chamadas de áudio e vídeo em tempo real peer-to-peer utilizando WebRTC com alta fidelidade e baixa latência sem depender de softwares de terceiros.",
    },
    {
        question: "Posso criar grupos?",
        answer: "Sim, você pode criar salas e canais em grupo com múltiplos membros, controle de administradores, moderação e mensagens fixadas.",
    },
    {
        question: "Posso enviar arquivos?",
        answer: "Sim, você pode anexar imagens, documentos PDF, planilhas e mensagens de voz gravadas diretamente no chat com validação de tipo MIME.",
    },
    {
        question: "Posso usar o ConvoTalk no celular?",
        answer: "Sim! O ConvoTalk foi desenvolvido como PWA (Progressive Web App), funcionando perfeitamente em navegadores mobile ou instalado diretamente na tela inicial do seu celular.",
    },
    {
        question: "Como minhas mensagens são protegidas?",
        answer: "Todas as conexões utilizam túneis criptografados HTTPS/WSS, autenticação por cookies HTTP-only, rate limiting e validação estrita de schema Zod em todas as mensagens trafegadas.",
    },
];

export default function HomePage() {
    const { activeSection, scrollY } = useScrollSpy();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const scrolled = scrollY > 40;
    const showBackToTop = scrollY > 400;

    const toggleFaq = (index: number) => {
        setOpenFaq((prev) => (prev === index ? null : index));
    };

    return (
        <div className="min-h-dvh-fallback bg-background text-on-surface font-sans antialiased selection:bg-primary-container selection:text-white">
            <SEO
                title="Converse em tempo real"
                description="ConvoTalk - Converse em tempo real com quem importa. Plataforma completa para mensagens instantâneas, grupos, chamadas de áudio e vídeo e compartilhamento de arquivos."
                canonical="/"
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "ConvoTalk",
                        url: "https://convotalk.live",
                        description:
                            "Plataforma completa para mensagens instantâneas, grupos, chamadas de áudio e vídeo e compartilhamento de arquivos em tempo real.",
                        applicationCategory: "CommunicationApplication",
                        operatingSystem: "Web",
                        offers: {
                            "@type": "Offer",
                            price: "0",
                            priceCurrency: "BRL",
                        },
                    })}
                </script>
            </Helmet>

            {/* 1. NAVBAR */}
            <Navbar activeSection={activeSection} scrolled={scrolled} />

            {/* 2. HERO */}
            <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-grid-dots">
                {/* Radial emerald glows */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[550px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute -top-24 right-10 w-96 h-96 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    {/* Version pill */}
                    <Reveal>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-surface-container-high/60 backdrop-blur text-xs font-medium text-on-surface mb-8 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-primary font-semibold">
                                Nova versão v2.0
                            </span>
                            <span className="text-outline-variant">•</span>
                            <span className="text-on-surface-variant">
                                Chamadas WebRTC & PWA Ativados
                            </span>
                        </div>
                    </Reveal>

                    {/* Title & Sub */}
                    <Reveal delay={100}>
                        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-on-surface max-w-4xl mx-auto leading-[1.15]">
                            Converse. Compartilhe. Conecte-se. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#77fd94] to-primary-container">
                                Em tempo real.
                            </span>
                        </h1>
                    </Reveal>

                    <Reveal delay={200}>
                        <p className="mt-6 text-lg sm:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                            Uma plataforma completa para mensagens instantâneas, grupos, chamadas de áudio e vídeo e compartilhamento de arquivos.
                        </p>
                    </Reveal>

                    {/* CTAs */}
                    <Reveal delay={300}>
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/login?mode=register"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-container to-[#00be55] text-white px-7 py-3.5 rounded-lg font-semibold text-sm shadow-[0_0_25px_rgba(0,168,75,0.4)] hover:shadow-[0_0_35px_rgba(89,224,123,0.6)] hover:-translate-y-0.5 transition-all"
                            >
                                <span>Começar agora</span>
                                <span className="material-symbols-outlined text-lg">
                                    arrow_forward
                                </span>
                            </Link>
                            <Link
                                to="/login"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-outline-variant bg-surface-container/60 hover:bg-surface-container-high text-on-surface px-7 py-3.5 rounded-lg font-semibold text-sm transition-all"
                            >
                                <span>Entrar na conta</span>
                            </Link>
                        </div>
                    </Reveal>

                    {/* Chat preview mockup */}
                    <div className="mt-14 max-w-4xl mx-auto text-left">
                        <PreviewChat />
                        <p className="text-center text-xs text-on-surface-variant mt-4">
                            Experimente o ConvoTalk — Envie uma mensagem e veja a comunicação acontecer em tempo real.
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. PRODUCT CAPABILITY STRIP */}
            <section className="border-y border-outline-variant/60 bg-surface-container-lowest/90 py-4 px-4 overflow-x-auto">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 min-w-max text-xs font-medium text-on-surface-variant">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 hover:border-primary/40 transition-colors">
                        <span className="text-primary font-bold">⚡</span>
                        <span>Mensagens em tempo real</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 hover:border-primary/40 transition-colors">
                        <span className="text-primary">👥</span>
                        <span>Conversas em grupo</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 hover:border-primary/40 transition-colors">
                        <span className="text-primary">🎥</span>
                        <span>Áudio e vídeo WebRTC</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 hover:border-primary/40 transition-colors">
                        <span className="text-primary">📎</span>
                        <span>Compartilhamento de arquivos</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 hover:border-primary/40 transition-colors">
                        <span className="text-primary">🔎</span>
                        <span>
                            Busca inteligente{" "}
                            <kbd className="px-1.5 py-0.5 bg-surface-container-high rounded text-[10px] border border-outline-variant">
                                ⌘K
                            </kbd>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 hover:border-primary/40 transition-colors">
                        <span className="text-primary">📱</span>
                        <span>PWA & Suporte Offline</span>
                    </div>
                </div>
            </section>

            {/* 4. FEATURE OVERVIEW */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface" id="recursos">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-bold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            Recursos Centrais
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mt-3">
                            Tudo o que você precisa para conversar
                        </h2>
                        <p className="mt-4 text-base sm:text-lg text-on-surface-variant">
                            Mais do que mensagens. O ConvoTalk reúne as principais ferramentas para comunicação em um único lugar.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <Reveal delay={0}>
                            <div className="glass-card glass-card-hover p-6 rounded-xl transition-all h-full">
                                <div className="w-12 h-12 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary mb-4">
                                    <span
                                        className="material-symbols-outlined text-2xl"
                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                    >
                                        bolt
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Mensagens em tempo real
                                </h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    Envie e receba mensagens instantaneamente com indicadores de digitação, presença online e confirmação de leitura.
                                </p>
                            </div>
                        </Reveal>

                        {/* Card 2 */}
                        <Reveal delay={100}>
                            <div className="glass-card glass-card-hover p-6 rounded-xl transition-all h-full">
                                <div className="w-12 h-12 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary mb-4">
                                    <span
                                        className="material-symbols-outlined text-2xl"
                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                    >
                                        groups
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Conversas privadas e grupos
                                </h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    Converse individualmente ou reúna várias pessoas em uma mesma conversa com canais temáticos dedicados.
                                </p>
                            </div>
                        </Reveal>

                        {/* Card 3 */}
                        <Reveal delay={200}>
                            <div className="glass-card glass-card-hover p-6 rounded-xl transition-all h-full">
                                <div className="w-12 h-12 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary mb-4">
                                    <span
                                        className="material-symbols-outlined text-2xl"
                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                    >
                                        video_call
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Chamadas de áudio e vídeo
                                </h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    Inicie chamadas diretamente de uma conversa usando comunicação peer-to-peer em tempo real via WebRTC.
                                </p>
                            </div>
                        </Reveal>

                        {/* Card 4 */}
                        <Reveal delay={300}>
                            <div className="glass-card glass-card-hover p-6 rounded-xl transition-all h-full">
                                <div className="w-12 h-12 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary mb-4">
                                    <span
                                        className="material-symbols-outlined text-2xl"
                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                    >
                                        cloud_upload
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Compartilhamento de arquivos
                                </h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    Envie imagens, documentos, áudios e outros arquivos diretamente pelo chat com preview instantâneo.
                                </p>
                            </div>
                        </Reveal>

                        {/* Card 5 */}
                        <Reveal delay={400}>
                            <div className="glass-card glass-card-hover p-6 rounded-xl transition-all h-full">
                                <div className="w-12 h-12 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary mb-4">
                                    <span
                                        className="material-symbols-outlined text-2xl"
                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                    >
                                        push_pin
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Organização das conversas
                                </h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    Responda, fixe, reaja, edite e organize suas mensagens mantendo as prioridades visíveis a todos.
                                </p>
                            </div>
                        </Reveal>

                        {/* Card 6 */}
                        <Reveal delay={500}>
                            <div className="glass-card glass-card-hover p-6 rounded-xl transition-all h-full">
                                <div className="w-12 h-12 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary mb-4">
                                    <span
                                        className="material-symbols-outlined text-2xl"
                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                    >
                                        search
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Busca inteligente
                                </h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    Encontre rapidamente mensagens, contatos e informações dentro das suas conversas usando comandos rápidos.
                                </p>
                            </div>
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
                                <div className="grid grid-cols-12 min-h-[460px]">
                                    {/* Sidebar preview */}
                                    <div className="col-span-4 bg-surface-container-low border-r border-outline-variant/60 p-3 hidden sm:flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-outline">
                                                Conversas
                                            </div>
                                            {/* Contact: Caique */}
                                            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-high/40 hover:bg-surface-container-high transition-colors cursor-pointer">
                                                <div className="relative">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-900/60 text-primary flex items-center justify-center font-bold text-xs">
                                                        C
                                                    </div>
                                                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-primary border-2 border-[#161d16]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-on-surface truncate">
                                                        caique
                                                    </p>
                                                    <p className="text-[10px] text-on-surface-variant truncate">
                                                        Combinado às 15h!
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Contact: Teste (Active) */}
                                            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-primary/15 border border-primary/30 transition-colors cursor-pointer">
                                                <div className="relative">
                                                    <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                                                        T
                                                    </div>
                                                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-primary border-2 border-[#161d16]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-primary truncate">
                                                        teste
                                                    </p>
                                                    <p className="text-[10px] text-primary/80 truncate">
                                                        digitando...
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
                                                        Novo deploy feito
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
                                                        online
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Pinned message badge */}
                                            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant">
                                                <span className="material-symbols-outlined text-[13px] text-primary">
                                                    push_pin
                                                </span>
                                                <span>Sprint v2</span>
                                            </div>
                                        </div>

                                        {/* Messages Area */}
                                        <div className="p-4 space-y-3.5 text-xs">
                                            {/* Inbound message with reply */}
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="bg-surface-container-high border border-outline-variant rounded-xl rounded-tl-sm p-3 max-w-[85%]">
                                                    <div className="text-[10px] text-primary font-medium mb-1 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">
                                                            lock
                                                        </span>
                                                        <span>Mensagem segura</span>
                                                    </div>
                                                    <p className="text-on-surface">
                                                        As APIs do WebSocket já estão respondendo com latência abaixo de 20ms.
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
                                                        Excelente! Acabei de rodar a suíte de testes de stress e segurou 10k conexões simultâneas.
                                                    </p>
                                                    <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-primary">
                                                        <span>14:03</span>
                                                        <span className="font-bold">Lido ✓✓</span>
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
                                                <span>teste está digitando...</span>
                                            </div>
                                        </div>

                                        {/* Input footer */}
                                        <div className="p-3 border-t border-outline-variant/50 bg-surface-container/60 flex items-center gap-2">
                                            <input
                                                className="bg-surface-container-high border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-on-surface flex-1 focus:outline-none focus:border-primary"
                                                placeholder="Escreva uma mensagem..."
                                                readOnly
                                                type="text"
                                                defaultValue="Show! Vamos abrir a call de demonstração?"
                                            />
                                            <div className="bg-primary text-on-primary-container p-1.5 rounded-lg flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[16px]">
                                                    send
                                                </span>
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
                            <span className="text-xs font-bold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                Comunicação Instantânea
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mt-4">
                                Mais do que apenas mensagens
                            </h2>
                            <p className="text-base text-on-surface-variant mt-3 leading-relaxed">
                                Uma experiência de comunicação pensada para conversas que não param. Mantenha-se sempre sincronizado com respostas rápidas e contexto preservado.
                            </p>
                        </Reveal>

                        <div className="space-y-3 pt-2">
                            {[
                                "Indicador de digitação dinâmico em tempo real",
                                "Status online e presença instantânea com WebSockets",
                                "Confirmação de leitura e entrega (Lido ✓✓)",
                                "Reações expressivas com emojis nas mensagens",
                                "Respostas em fio (threads) para conversas focadas",
                                "Mensagens fixadas no topo do chat",
                                "Edição rápida e exclusão segura sem rastro",
                            ].map((feature, idx) => (
                                <Reveal key={idx} delay={idx * 60}>
                                    <div className="flex items-center gap-3 text-sm text-on-surface">
                                        <span
                                            className="material-symbols-outlined text-primary text-xl"
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            check_circle
                                        </span>
                                        <span>{feature}</span>
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
                            <span className="text-xs font-bold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                WebRTC Nativo
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mt-4">
                                Quando uma mensagem não é suficiente
                            </h2>
                            <p className="text-base text-on-surface-variant mt-3 leading-relaxed">
                                Comece uma chamada de áudio ou vídeo diretamente da conversa com zero atrito e sem precisar de softwares externos ou plugins.
                            </p>
                        </Reveal>

                        <div className="space-y-4 pt-2">
                            <Reveal delay={100}>
                                <div className="flex items-start gap-3.5 p-3 rounded-lg bg-surface-container-low border border-outline-variant/60">
                                    <span className="text-xl">🎙️</span>
                                    <div>
                                        <h4 className="text-sm font-bold text-on-surface">
                                            Áudio em tempo real com cancelamento de ruído
                                        </h4>
                                        <p className="text-xs text-on-surface-variant mt-0.5">
                                            Voz cristalina processada pelo navegador com supressão de eco nativa.
                                        </p>
                                    </div>
                                </div>
                            </Reveal>

                            <Reveal delay={200}>
                                <div className="flex items-start gap-3.5 p-3 rounded-lg bg-surface-container-low border border-outline-variant/60">
                                    <span className="text-xl">📹</span>
                                    <div>
                                        <h4 className="text-sm font-bold text-on-surface">
                                            Vídeo HD de baixa latência ponto a ponto
                                        </h4>
                                        <p className="text-xs text-on-surface-variant mt-0.5">
                                            Resolução fluida adaptável de acordo com a velocidade da conexão.
                                        </p>
                                    </div>
                                </div>
                            </Reveal>

                            <Reveal delay={300}>
                                <div className="flex items-start gap-3.5 p-3 rounded-lg bg-surface-container-low border border-outline-variant/60">
                                    <span className="text-xl">⚙️</span>
                                    <div>
                                        <h4 className="text-sm font-bold text-on-surface">
                                            Controles intuitivos na tela
                                        </h4>
                                        <p className="text-xs text-on-surface-variant mt-0.5">
                                            Mude microfone, ligue câmera ou compartilhe sua tela em 1 clique.
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
                                <div className="relative bg-gradient-to-b from-[#161d16] to-[#091009] h-96 flex flex-col justify-between p-6">
                                    {/* Participant Video Simulated Center */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-container to-primary flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_40px_rgba(89,224,123,0.3)]">
                                            P
                                        </div>
                                        {/* Audio wave animation */}
                                        <div className="flex items-center gap-1.5 mt-4">
                                            <span className="w-1 h-5 bg-primary rounded-full animate-pulse" />
                                            <span
                                                className="w-1 h-8 bg-primary rounded-full animate-pulse"
                                                style={{ animationDelay: "0.15s" }}
                                            />
                                            <span
                                                className="w-1 h-3 bg-primary rounded-full animate-pulse"
                                                style={{ animationDelay: "0.3s" }}
                                            />
                                            <span
                                                className="w-1 h-7 bg-primary rounded-full animate-pulse"
                                                style={{ animationDelay: "0.45s" }}
                                            />
                                            <span
                                                className="w-1 h-4 bg-primary rounded-full animate-pulse"
                                                style={{ animationDelay: "0.2s" }}
                                            />
                                        </div>
                                    </div>

                                    {/* Top meta bar */}
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="flex items-center gap-2 bg-surface-container-lowest/80 backdrop-blur px-3 py-1.5 rounded-lg border border-outline-variant/60 text-xs">
                                            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                                            <span className="font-bold text-on-surface">Paulo</span>
                                            <span className="text-outline-variant">•</span>
                                            <span className="text-primary font-mono">1080p 60fps</span>
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
                                            Você
                                        </span>
                                    </div>

                                    {/* Floating Call Control Bar */}
                                    <div className="relative z-20 self-center bg-surface-container/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-outline-variant flex items-center gap-4 shadow-xl">
                                        <button
                                            type="button"
                                            aria-label="Microfone"
                                            className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                mic
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Vídeo"
                                            className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                videocam
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Compartilhar tela"
                                            className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                screen_share
                                            </span>
                                        </button>
                                        <div className="w-px h-6 bg-outline-variant" />
                                        <button
                                            type="button"
                                            aria-label="Encerrar chamada"
                                            className="w-10 h-10 rounded-full bg-error-container hover:bg-red-700 flex items-center justify-center text-white transition-colors shadow-[0_0_15px_rgba(255,100,100,0.3)] cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                call_end
                                            </span>
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
                        <span className="text-xs font-bold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            Espaços Colaborativos
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mt-4">
                            Converse do seu jeito: de 1-a-1 a grandes equipes
                        </h2>
                        <p className="mt-4 text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto">
                            Crie salas temáticas, gerencie participantes e centralize discussões com controle total de moderação e privilégios.
                        </p>
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
                                                Canal Público
                                            </span>
                                        </div>
                                        <p className="text-xs text-on-surface-variant">
                                            18 membros • 6 online agora
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-container-high border border-outline-variant text-on-surface">
                                        Regras do Canal
                                    </span>
                                    <button
                                        type="button"
                                        className="bg-primary text-on-primary-container text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1 cursor-pointer hover:bg-primary-fixed transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">
                                            person_add
                                        </span>
                                        <span>Convidar</span>
                                    </button>
                                </div>
                            </div>

                            {/* Pinned Announcement Banner */}
                            <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center gap-2 text-xs text-on-surface">
                                <span className="material-symbols-outlined text-primary text-[16px]">
                                    campaign
                                </span>
                                <span className="font-semibold text-primary">
                                    Anúncio Fixado:
                                </span>
                                <span className="text-on-surface-variant">
                                    Atualização da stack ConvoTalk v2.4 realizada com sucesso às 10:00 UTC.
                                </span>
                            </div>

                            {/* Group Content Viewport */}
                            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[260px]">
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
                                                    Admin
                                                </span>
                                                <span className="text-[10px] text-on-surface-variant">
                                                    11:20
                                                </span>
                                            </div>
                                            <p className="text-xs text-on-surface mt-1">
                                                Pessoal, o canal de chamadas para a daily está aberto na sala de reuniões.
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
                                                    Membro
                                                </span>
                                                <span className="text-[10px] text-on-surface-variant">
                                                    11:22
                                                </span>
                                            </div>
                                            <p className="text-xs text-on-surface mt-1">
                                                Conectando agora! Já deixei o pull request pronto pra revisão.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side Panel: Participants */}
                                <div className="md:col-span-4 bg-surface-container-low/60 border-l border-outline-variant/60 p-4 space-y-3">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-outline">
                                        Participantes (6)
                                    </div>
                                    <div className="flex items-center justify-between text-xs py-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-primary" />
                                            <span className="text-on-surface font-medium">
                                                Lucas (Lead)
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-primary">Admin</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs py-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-primary" />
                                            <span className="text-on-surface font-medium">
                                                Marina Costa
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-on-surface-variant">
                                            Moderador
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
                                            Membro
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs py-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-outline" />
                                            <span className="text-on-surface-variant">
                                                Rodrigo Alves
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-outline">Ausente</span>
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
                                    <span className="material-symbols-outlined text-lg">
                                        admin_panel_settings
                                    </span>
                                </div>
                                <h4 className="text-base font-bold text-on-surface mb-1">
                                    Membros & Permissões
                                </h4>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    Papéis granulares de administrador, moderador e membro para controlar quem pode enviar mensagens, fixar ou moderar.
                                </p>
                            </div>
                        </Reveal>

                        <Reveal delay={200}>
                            <div className="glass-card p-5 rounded-xl h-full">
                                <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold mb-3">
                                    <span className="material-symbols-outlined text-lg">
                                        notifications
                                    </span>
                                </div>
                                <h4 className="text-base font-bold text-on-surface mb-1">
                                    Notificações por Canal
                                </h4>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    Silencie conversas secundárias ou receba notificações imediatas somente quando for mencionado com @nome.
                                </p>
                            </div>
                        </Reveal>

                        <Reveal delay={300}>
                            <div className="glass-card p-5 rounded-xl h-full">
                                <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold mb-3">
                                    <span className="material-symbols-outlined text-lg">
                                        badge
                                    </span>
                                </div>
                                <h4 className="text-base font-bold text-on-surface mb-1">
                                    Perfis & Avatares Personalizados
                                </h4>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    Identidade rica com status customizados, bio, links e avatares que facilitam o reconhecimento de cada membro.
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
                                        <span className="material-symbols-outlined text-xl">
                                            picture_as_pdf
                                        </span>
                                    </div>
                                    <div>
                                        <h5 className="text-xs sm:text-sm font-bold text-on-surface">
                                            relatorio_arquitetura_v2.pdf
                                        </h5>
                                        <p className="text-[11px] text-on-surface-variant">
                                            4.2 MB • Enviado por Paulo
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="p-2 rounded-lg bg-surface-container-high hover:bg-primary-container text-on-surface hover:text-white transition-colors cursor-pointer"
                                    title="Download"
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        download
                                    </span>
                                </button>
                            </div>
                        </Reveal>

                        <Reveal delay={100}>
                            {/* Voice Audio Player Card */}
                            <div className="glass-card p-4 rounded-xl border border-outline-variant space-y-2">
                                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                                    <span className="flex items-center gap-1 text-primary font-semibold">
                                        <span className="material-symbols-outlined text-[16px]">
                                            graphic_eq
                                        </span>
                                        Mensagem de áudio
                                    </span>
                                    <span className="font-mono">0:42</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        aria-label="Tocar áudio"
                                        className="w-9 h-9 rounded-full bg-primary text-on-primary-container flex items-center justify-center shrink-0 cursor-pointer"
                                    >
                                        <span
                                            className="material-symbols-outlined text-[20px]"
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            play_arrow
                                        </span>
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
                                    <span className="text-primary font-bold">TypeScript</span>
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
                            <span className="text-xs font-bold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                Produtividade & Arquivos
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mt-4">
                                Compartilhe mais do que mensagens
                            </h2>
                            <p className="text-base text-on-surface-variant mt-3 leading-relaxed">
                                Envie arquivos sem perder a qualidade original. Centralize documentos importantes, notas de voz e capturas de tela diretamente no fluxo contínuo da conversa.
                            </p>
                        </Reveal>

                        <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm text-on-surface">
                            <Reveal delay={100}>
                                <div className="flex items-center gap-2">
                                    <span className="text-primary font-bold">📷</span>
                                    <span>Imagens em alta definição</span>
                                </div>
                            </Reveal>
                            <Reveal delay={150}>
                                <div className="flex items-center gap-2">
                                    <span className="text-primary font-bold">📄</span>
                                    <span>Documentos & PDFs</span>
                                </div>
                            </Reveal>
                            <Reveal delay={200}>
                                <div className="flex items-center gap-2">
                                    <span className="text-primary font-bold">🎵</span>
                                    <span>Mensagens de áudio contínuas</span>
                                </div>
                            </Reveal>
                            <Reveal delay={250}>
                                <div className="flex items-center gap-2">
                                    <span className="text-primary font-bold">📎</span>
                                    <span>Arquivos compactados e código</span>
                                </div>
                            </Reveal>
                        </div>

                        {/* Special feature callout box */}
                        <Reveal delay={300}>
                            <div className="p-4 rounded-xl bg-surface-container-high/60 border border-primary/30 flex items-start gap-3">
                                <span className="text-2xl">📑</span>
                                <div className="text-xs sm:text-sm">
                                    <span className="font-bold text-primary">
                                        Exporte suas conversas:
                                    </span>
                                    <p className="text-on-surface-variant mt-1 leading-relaxed">
                                        Guarde o histórico das suas conversas e canais exportando-os com facilidade para PDF formatado com carimbos de data/hora oficiais.
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
                        <span className="text-xs font-bold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            Sempre Disponível
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mt-4">
                            Suas conversas, onde você estiver
                        </h2>
                        <p className="mt-4 text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto">
                            Uma experiência web moderna, responsiva e preparada para qualquer dispositivo, até mesmo quando o sinal cai.
                        </p>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 text-left">
                        {/* Card 1 */}
                        <Reveal delay={100}>
                            <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/40 transition-all flex flex-col justify-between h-full">
                                <div>
                                    <div className="w-12 h-12 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary mb-4">
                                        <span className="material-symbols-outlined text-2xl">
                                            install_desktop
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-on-surface mb-2">
                                        Progressive Web App (PWA)
                                    </h3>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        Instale no Windows, macOS, Android ou iOS sem passar por lojas de aplicativos. Experiência em tela cheia idêntica a um app nativo.
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-outline-variant/40 flex items-center gap-2 text-xs text-primary font-semibold">
                                    <span className="material-symbols-outlined text-[16px]">
                                        devices
                                    </span>
                                    <span>Compatível com todos os SOs</span>
                                </div>
                            </div>
                        </Reveal>

                        {/* Card 2 */}
                        <Reveal delay={200}>
                            <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/40 transition-all flex flex-col justify-between h-full">
                                <div>
                                    <div className="w-12 h-12 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary mb-4">
                                        <span className="material-symbols-outlined text-2xl">
                                            database
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-on-surface mb-2">
                                        Persistência Offline & IndexedDB
                                    </h3>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        Consulte seu histórico de mensagens e anexos recentes mesmo sem conexão à internet. Cache local instantâneo com zero tela branca.
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-outline-variant/40 flex items-center gap-2 text-xs text-primary font-semibold">
                                    <span className="material-symbols-outlined text-[16px]">
                                        cloud_off
                                    </span>
                                    <span>Acesso local ininterrupto</span>
                                </div>
                            </div>
                        </Reveal>

                        {/* Card 3 */}
                        <Reveal delay={300}>
                            <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/40 transition-all flex flex-col justify-between h-full">
                                <div>
                                    <div className="w-12 h-12 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary mb-4">
                                        <span className="material-symbols-outlined text-2xl">
                                            sync
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-on-surface mb-2">
                                        Fila de Envio Inteligente (Queue)
                                    </h3>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        Envie mensagens mesmo offline; o ConvoTalk enfileira e sincroniza tudo automaticamente no servidor assim que a conexão retornar.
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-outline-variant/40 flex items-center gap-2 text-xs text-primary font-semibold">
                                    <span className="material-symbols-outlined text-[16px]">
                                        schedule_send
                                    </span>
                                    <span>Zero perda de mensagens</span>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* 10. SECURITY */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface" id="seguranca">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <Reveal>
                            <span className="text-xs font-bold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                Confiabilidade & Privacidade
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mt-3">
                                Segurança em cada camada
                            </h2>
                            <p className="mt-4 text-base sm:text-lg text-on-surface-variant">
                                Projetado com rigor técnico para manter suas conversas e dados completamente protegidos contra acessos indesejados.
                            </p>
                        </Reveal>
                    </div>

                    {/* 2x2 Security Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        {/* Sec Card 1 */}
                        <Reveal delay={100}>
                            <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/40 transition-colors h-full">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl">
                                        🔐
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-on-surface">
                                        Autenticação Segura
                                    </h3>
                                </div>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    Access tokens JWT de curta duração com rotação contínua de refresh tokens armazenados exclusivamente em cookies{" "}
                                    <code className="text-primary font-mono text-xs">HTTP-only</code>{" "}
                                    e protegidos contra ataques XSS.
                                </p>
                            </div>
                        </Reveal>

                        {/* Sec Card 2 */}
                        <Reveal delay={200}>
                            <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/40 transition-colors h-full">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl">
                                        🛡️
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-on-surface">
                                        Proteção contra Abuso
                                    </h3>
                                </div>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    Rate limiting em múltiplas camadas tanto para endpoints REST na API Express quanto para eventos em tempo real no Socket.IO, neutralizando abusos e spam.
                                </p>
                            </div>
                        </Reveal>

                        {/* Sec Card 3 */}
                        <Reveal delay={300}>
                            <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/40 transition-colors h-full">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                                        ✓
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-on-surface">
                                        Validação Estrita de Dados
                                    </h3>
                                </div>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    Validação integral e sanitização de payloads com schemas rigorosos Zod em runtime, garantindo prevenção estrutural contra injeções SQL/NoSQL e dados maliciosos.
                                </p>
                            </div>
                        </Reveal>

                        {/* Sec Card 4 */}
                        <Reveal delay={400}>
                            <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/40 transition-colors h-full">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl">
                                        🌐
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-on-surface">
                                        Comunicação Segura
                                    </h3>
                                </div>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    Túneis criptografados via HTTPS e WebSockets seguros (WSS), além de headers de segurança CSP modernos e políticas CORS restritivas de ponta a ponta.
                                </p>
                            </div>
                        </Reveal>
                    </div>

                    {/* Bottom Pill */}
                    <Reveal delay={500}>
                        <div className="mt-10 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-high border border-outline-variant text-xs text-on-surface font-medium">
                                <span className="material-symbols-outlined text-primary text-[18px]">
                                    verified
                                </span>
                                <span>
                                    Arquivos protegidos com verificação de tipo MIME e armazenamento seguro.
                                </span>
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
                        <span className="text-xs font-bold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            Engenharia Robusta
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mt-4">
                            Construído para comunicação em tempo real
                        </h2>
                        <p className="mt-4 text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto">
                            Uma arquitetura moderna e reativa criada para oferecer altíssima performance, baixa latência e escalabilidade horizontal contínua.
                        </p>
                    </Reveal>

                    {/* Architecture Diagram Flow */}
                    <Reveal delay={100}>
                        <div className="mt-14 max-w-4xl mx-auto glass-card p-8 rounded-2xl border border-outline-variant relative">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
                                {/* Node 1: Client */}
                                <div className="flex-1 w-full p-5 rounded-xl bg-surface-container border border-outline-variant text-left hover:border-primary/40 transition-colors">
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
                                        <span className="material-symbols-outlined text-[18px]">
                                            devices
                                        </span>
                                        <span>Cliente Frontend</span>
                                    </div>
                                    <h4 className="font-bold text-sm text-on-surface">
                                        React 18 + Tailwind
                                    </h4>
                                    <p className="text-xs text-on-surface-variant mt-1">
                                        PWA offline-first, WebSockets Client & WebRTC Media Engine.
                                    </p>
                                </div>

                                {/* Connector 1 */}
                                <div className="flex flex-col items-center justify-center text-primary font-mono text-[11px] py-2 md:py-0 px-2">
                                    <span className="hidden md:block">⇆</span>
                                    <span className="md:hidden">⇅</span>
                                    <span className="text-[10px] text-on-surface-variant font-sans text-center">
                                        WSS / WebRTC
                                    </span>
                                </div>

                                {/* Node 2: Gateway & API */}
                                <div className="flex-1 w-full p-5 rounded-xl bg-surface-container border border-outline-variant text-left hover:border-primary/40 transition-colors">
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
                                        <span className="material-symbols-outlined text-[18px]">
                                            dns
                                        </span>
                                        <span>Gateway & API</span>
                                    </div>
                                    <h4 className="font-bold text-sm text-on-surface">
                                        Node.js + Express
                                    </h4>
                                    <p className="text-xs text-on-surface-variant mt-1">
                                        Socket.IO Clusters, Auth JWT Middleware e Rate Limiters.
                                    </p>
                                </div>

                                {/* Connector 2 */}
                                <div className="flex flex-col items-center justify-center text-primary font-mono text-[11px] py-2 md:py-0 px-2">
                                    <span className="hidden md:block">⇆</span>
                                    <span className="md:hidden">⇅</span>
                                    <span className="text-[10px] text-on-surface-variant font-sans text-center">
                                        Connection Pool
                                    </span>
                                </div>

                                {/* Node 3: Database & Storage */}
                                <div className="flex-1 w-full p-5 rounded-xl bg-surface-container border border-outline-variant text-left hover:border-primary/40 transition-colors">
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
                                        <span className="material-symbols-outlined text-[18px]">
                                            database
                                        </span>
                                        <span>Banco & Armazenamento</span>
                                    </div>
                                    <h4 className="font-bold text-sm text-on-surface">
                                        MongoDB & Storage
                                    </h4>
                                    <p className="text-xs text-on-surface-variant mt-1">
                                        Coleções indexadas, persistência de canais e upload de mídias.
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
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface" id="como-funciona">
                <div className="max-w-7xl mx-auto text-center">
                    <Reveal>
                        <span className="text-xs font-bold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            Onboarding Simples
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mt-4">
                            Comece em poucos segundos
                        </h2>
                        <p className="mt-4 text-base sm:text-lg text-on-surface-variant max-w-xl mx-auto">
                            Sem configurações complicadas ou instalações pesadas.
                        </p>
                    </Reveal>

                    {/* Timeline with connecting glowing line */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Desktop Line */}
                        <div className="hidden md:block absolute top-8 left-[18%] right-[18%] h-[2px] bg-gradient-to-r from-primary-container via-primary to-primary-container -z-0 opacity-40" />

                        {/* Step 01 */}
                        <Reveal delay={100}>
                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-primary flex items-center justify-center text-primary font-bold text-xl mb-6 shadow-[0_0_20px_rgba(89,224,123,0.3)] bg-[#0e150e]">
                                    01
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Crie sua conta
                                </h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
                                    Configure seu perfil, escolha seu nome de usuário e personalize sua conta em segundos.
                                </p>
                            </div>
                        </Reveal>

                        {/* Step 02 */}
                        <Reveal delay={200}>
                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-primary flex items-center justify-center text-primary font-bold text-xl mb-6 shadow-[0_0_20px_rgba(89,224,123,0.3)] bg-[#0e150e]">
                                    02
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Encontre alguém
                                </h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
                                    Procure contatos cadastrados através da busca instantânea ou entre em salas públicas e grupos temáticos.
                                </p>
                            </div>
                        </Reveal>

                        {/* Step 03 */}
                        <Reveal delay={300}>
                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-primary flex items-center justify-center text-primary font-bold text-xl mb-6 shadow-[0_0_20px_rgba(89,224,123,0.3)] bg-[#0e150e]">
                                    03
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Comece a conversar
                                </h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
                                    Envie mensagens, transfira arquivos ou inicie uma videoconferência com um único clique.
                                </p>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* 13. FAQ (Interactive Accordion) */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-container-lowest border-t border-outline-variant/50">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <Reveal>
                            <span className="text-xs font-bold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                Dúvidas Frequentes
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mt-4">
                                Perguntas Frequentes
                            </h2>
                            <p className="mt-4 text-base text-on-surface-variant">
                                Tudo o que você precisa saber sobre o ConvoTalk.
                            </p>
                        </Reveal>
                    </div>

                    {/* Accordion Items */}
                    <div className="space-y-4">
                        {FAQ_ITEMS.map((faq, index) => {
                            const isOpen = openFaq === index;
                            return (
                                <Reveal key={index} delay={index * 50}>
                                    <div className="glass-card rounded-xl border border-outline-variant/70 overflow-hidden transition-colors">
                                        <button
                                            type="button"
                                            onClick={() => toggleFaq(index)}
                                            className="w-full p-5 text-left flex items-center justify-between gap-4 hover:text-primary transition-colors focus:outline-none cursor-pointer"
                                        >
                                            <span className="font-bold text-sm sm:text-base text-on-surface">
                                                {faq.question}
                                            </span>
                                            <span
                                                className={`material-symbols-outlined text-primary text-xl transition-transform duration-300 ${
                                                    isOpen ? "rotate-180" : ""
                                                }`}
                                            >
                                                expand_more
                                            </span>
                                        </button>
                                        {isOpen && (
                                            <div className="px-5 pb-5 pt-0 text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/30 pt-3">
                                                {faq.answer}
                                            </div>
                                        )}
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
                                    Sua próxima conversa começa aqui.
                                </h2>
                                <p className="text-base sm:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
                                    Crie sua conta e experimente uma experiência de comunicação feita para acontecer em tempo real.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link
                                        to="/login?mode=register"
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-container to-[#00be55] text-white px-8 py-4 rounded-xl font-bold text-sm shadow-[0_0_30px_rgba(0,168,75,0.5)] hover:shadow-[0_0_40px_rgba(89,224,123,0.7)] hover:-translate-y-0.5 transition-all"
                                    >
                                        <span>Começar agora</span>
                                        <span className="material-symbols-outlined text-lg">
                                            arrow_forward
                                        </span>
                                    </Link>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 pb-12 border-b border-outline-variant/40">
                        {/* Brand column */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center gap-2">
                                <img
                                    src="/convo_talk_logo.png"
                                    alt="ConvoTalk"
                                    className="h-7 w-auto object-contain"
                                />
                                <span className="text-xl font-bold text-primary tracking-tight font-hanken">
                                    ConvoTalk
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-sm">
                                Comunicação em tempo real, segura e fluida. Desenvolvido para simplificar conversas particulares, salas públicas e videoconferências.
                            </p>
                            <div className="flex items-center gap-2 text-xs text-primary font-medium">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span>Todos os sistemas operacionais</span>
                            </div>
                        </div>

                        {/* Nav Column 1: Produto */}
                        <div className="space-y-3">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                                Produto
                            </h5>
                            <ul className="space-y-2 text-xs sm:text-sm text-on-surface-variant">
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#recursos">
                                        Recursos
                                    </a>
                                </li>
                                <li>
                                    <Link className="hover:text-primary transition-colors" to="/login?mode=register">
                                        Demonstração
                                    </Link>
                                </li>
                                <li>
                                    <Link className="hover:text-primary transition-colors" to="/login">
                                        Chamadas WebRTC
                                    </Link>
                                </li>
                                <li>
                                    <Link className="hover:text-primary transition-colors" to="/login">
                                        Grupos & Canais
                                    </Link>
                                </li>
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#recursos">
                                        PWA Mobile
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Nav Column 2: Plataforma */}
                        <div className="space-y-3">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                                Plataforma
                            </h5>
                            <ul className="space-y-2 text-xs sm:text-sm text-on-surface-variant">
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#como-funciona">
                                        Como funciona
                                    </a>
                                </li>
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#arquitetura">
                                        Arquitetura
                                    </a>
                                </li>
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#seguranca">
                                        Segurança
                                    </a>
                                </li>
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#como-funciona">
                                        Perguntas Frequentes
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Empty column / spacer in 6-col grid */}
                        <div className="hidden lg:block space-y-3" />

                        {/* Nav Column 4: Legal */}
                        <div className="space-y-3">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                                Legal
                            </h5>
                            <ul className="space-y-2 text-xs sm:text-sm text-on-surface-variant">
                                <li>
                                    <Link className="hover:text-primary transition-colors" to="/privacy">
                                        Privacidade
                                    </Link>
                                </li>
                                <li>
                                    <Link className="hover:text-primary transition-colors" to="/terms">
                                        Termos de Uso
                                    </Link>
                                </li>
                                <li>
                                    <Link className="hover:text-primary transition-colors" to="/privacy">
                                        Suporte
                                    </Link>
                                </li>
                                <li>
                                    <Link className="hover:text-primary transition-colors" to="/privacy">
                                        Contato
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
                        <p>© {new Date().getFullYear()} ConvoTalk. Todos os direitos reservados.</p>
                        <p className="flex items-center gap-2">
                            <span>Construído com</span>
                            <span className="text-primary font-semibold">Socket.IO</span>
                            <span>e</span>
                            <span className="text-primary font-semibold">WebRTC</span>
                        </p>
                    </div>
                </div>
            </footer>

            <BackToTop visible={showBackToTop} />
        </div>
    );
}
