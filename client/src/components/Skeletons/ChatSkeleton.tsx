export default function ChatSkeleton() {
    return (
        <div className="h-dvh-fallback flex bg-zinc-950">
            <div className="w-80 bg-zinc-900 border-r border-zinc-700 flex flex-col md:flex">
                <div className="p-4 border-b border-zinc-700">
                    <div className="w-24 h-4 bg-zinc-800 rounded animate-pulse" />
                </div>
                <div className="flex-1 p-4 space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="w-3/4 h-3 bg-zinc-800 rounded animate-pulse" />
                                <div className="w-1/2 h-3 bg-zinc-800 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 flex flex-col">
                <div className="px-4 py-3 border-b border-zinc-700">
                    <div className="w-40 h-4 bg-zinc-800 rounded animate-pulse" />
                </div>
                <div className="flex-1 p-4 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                        >
                            <div className="w-2/3 h-10 bg-zinc-800 rounded-lg animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
