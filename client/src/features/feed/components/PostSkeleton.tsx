export default function PostSkeleton() {
    return (
        <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 dark:border-noir-border dark:bg-noir-card">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-noir-surface-alt" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded bg-slate-200 dark:bg-noir-surface-alt" />
                    <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-noir-surface-alt/70" />
                </div>
            </div>
            <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded bg-slate-200 dark:bg-noir-surface-alt" />
                <div className="h-3 w-4/5 rounded bg-slate-200 dark:bg-noir-surface-alt" />
                <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-noir-surface-alt/70" />
            </div>
        </div>
    );
}
