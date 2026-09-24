export default function ChatMockup() {
    return (
        <div
            aria-hidden="true"
            className="relative w-full max-w-lg lg:max-w-xl bg-[#0e150e]/90 border border-emerald-500/20 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-emerald-500/35 select-none"
        >
            <div className="px-4 py-3 bg-black/40 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Equipe ConvoTalk</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-emerald-400/90 font-semibold">online</span>
                </div>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-[#070b07] text-xs flex-shrink-0 ring-2 ring-emerald-400/30">
                        CQ
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-200 text-xs">Caique Santos</span>
                            <span className="text-[10px] text-zinc-500">14:32</span>
                        </div>
                        <div className="bg-[#1b271b]/80 border border-white/5 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-zinc-200 max-w-sm shadow-sm">
                            Fala time! O update em tempo real via WebSockets já foi aplicado com sucesso. 🚀
                        </div>
                    </div>
                </div>

                <div className="flex items-end justify-end gap-2 pt-1">
                    <div className="space-y-1 flex flex-col items-end">
                        <div className="bg-[#00a84b] hover:bg-emerald-600 transition-colors text-white font-medium rounded-2xl rounded-br-sm px-4 py-2.5 max-w-xs shadow-lg shadow-emerald-950/40 text-left">
                            Excelente! Mensagens instantâneas e chamadas funcionando perfeitamente.
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                            <span>14:33</span>
                            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                    </div>
                    <div className="bg-[#131c13]/90 border border-white/5 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span className="text-[11px] text-zinc-500 italic">Mariana está digitando...</span>
                </div>
            </div>

            <div className="bg-black/40 px-4 py-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Conexão em tempo real ativa
                </span>
                <span className="text-zinc-500">Socket.IO &amp; WebRTC</span>
            </div>
        </div>
    );
}
