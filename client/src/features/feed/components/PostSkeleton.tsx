export default function PostSkeleton() {
    return (
        <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-noir-border dark:bg-noir-surface">
            <div className="flex items-center gap-3 p-4 sm:p-5">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-noir-surface-alt" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded bg-slate-200 dark:bg-noir-surface-alt" />
                    <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-noir-surface-alt/70" />
                </div>
            </div>
            <div className="space-y-2 px-4 pb-4 sm:px-5">
                <div className="h-3 w-full rounded bg-slate-200 dark:bg-noir-surface-alt" />
                <div className="h-3 w-4/5 rounded bg-slate-200 dark:bg-noir-surface-alt" />
                <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-noir-surface-alt/70" />
            </div>
            <div className="flex gap-4 border-t border-slate-100 px-4 py-3 dark:border-noir-border/70 sm:px-5">
                <div className="h-3 w-16 rounded bg-slate-200 dark:bg-noir-surface-alt" />
                <div className="h-3 w-20 rounded bg-slate-100 dark:bg-noir-surface-alt/70" />
            </div>
        </div>
    );
}
