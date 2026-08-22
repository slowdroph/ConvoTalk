const bubbleLines = [
    { width: "70%", offset: 0 },
    { width: "50%", offset: 8 },
];

function ChatBubble({
    align = "left",
    bg = "#1a211a",
    lines = bubbleLines,
}: {
    align?: "left" | "right";
    bg?: string;
    lines?: { width: string; offset: number }[];
}) {
    return (
        <div
            className={`rounded-xl px-4 py-3 shadow-lg ${align === "right" ? "bg-green-600" : ""}`}
            style={{ backgroundColor: align === "right" ? undefined : bg }}
        >
            <div className="space-y-2">
                {lines.map((line, i) => (
                    <div
                        key={i}
                        className={`h-2 rounded-full ${align === "right" ? "bg-white/50" : "bg-zinc-600"}`}
                        style={{
                            width: line.width,
                            marginLeft:
                                align === "right" ? "auto" : line.offset,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function Avatar({
    className,
    color = "#59e07b",
    ring = "#0e150e",
}: {
    className?: string;
    color?: string;
    ring?: string;
}) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="chatAvatarGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={color} />
                    <stop offset="100%" stopColor="#00a84b" />
                </linearGradient>
            </defs>
            <circle
                cx="12"
                cy="12"
                r="10"
                fill="url(#chatAvatarGrad)"
                stroke={ring}
                strokeWidth="2.5"
            />
            <circle cx="12" cy="9.5" r="3" fill="#fff" fillOpacity="0.9" />
            <path
                d="M4.5 18.5c1.5-3.2 4.2-4.7 7.5-4.7s6 1.5 7.5 4.7"
                fill="#fff"
                fillOpacity="0.9"
            />
        </svg>
    );
}

export default function ChatIllustration() {
    return (
        <div
            className="relative w-full max-w-md mx-auto select-none"
            aria-hidden="true"
        >
            <div className="relative rounded-3xl border border-zinc-700/60 bg-zinc-900/70 backdrop-blur-sm shadow-2xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-700/60">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    <div className="ml-3 flex items-center gap-2">
                        <Avatar className="w-5 h-5" />
                        <span className="text-xs text-zinc-400 font-medium">
                            Equipe
                        </span>
                        <span className="text-[10px] text-green-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            online
                        </span>
                    </div>
                </div>

                <div className="px-4 py-6 space-y-4">
                    <div className="animate-float">
                        <div className="flex items-end gap-2">
                            <Avatar className="w-7 h-7 shrink-0" />
                            <ChatBubble />
                        </div>
                    </div>

                    <div className="animate-float animation-delay-200 flex justify-end">
                        <ChatBubble
                            align="right"
                            lines={[{ width: "60%", offset: 0 }]}
                        />
                    </div>

                    <div className="animate-float animation-delay-400">
                        <div className="flex items-end gap-2">
                            <Avatar
                                className="w-7 h-7 shrink-0"
                                color="#7aa2f7"
                            />
                            <ChatBubble
                                bg="#252c24"
                                lines={[
                                    { width: "85%", offset: 0 },
                                    { width: "65%", offset: 10 },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="flex items-end gap-2">
                        <Avatar className="w-7 h-7 shrink-0" />
                        <div className="flex items-center gap-1.5 rounded-xl px-4 py-3 bg-zinc-800 border border-zinc-700">
                            <span
                                className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
                                style={{ animationDelay: "0ms" }}
                            />
                            <span
                                className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
                                style={{ animationDelay: "120ms" }}
                            />
                            <span
                                className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
                                style={{ animationDelay: "240ms" }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute -bottom-3 -right-3 w-24 h-24 bg-green-500/20 rounded-full blur-2xl animate-glowPulse" />
            <div
                className="absolute -top-4 -left-4 w-32 h-32 bg-green-600/10 rounded-full blur-3xl animate-glowPulse"
                style={{ animationDelay: "1.5s" }}
            />
        </div>
    );
}
