export default function SettingsSkeleton() {
    return (
        <div className="min-h-dvh-fallback bg-slate-50 dark:bg-zinc-950">
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-6 h-6 bg-slate-200 rounded animate-pulse dark:bg-zinc-800" />
                    <div className="w-40 h-6 bg-slate-200 rounded animate-pulse dark:bg-zinc-800" />
                </div>
                <div className="space-y-8">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 dark:bg-zinc-900 dark:border-zinc-800 dark:shadow-none"
                        >
                            <div className="w-1/3 h-4 bg-slate-200 rounded animate-pulse dark:bg-zinc-800" />
                            <div className="h-10 bg-slate-200 rounded-lg animate-pulse dark:bg-zinc-800" />
                            <div className="h-10 bg-slate-200 rounded-lg animate-pulse dark:bg-zinc-800" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
