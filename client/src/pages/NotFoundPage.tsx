
import SEO from "../components/SEO";
import LocalizedLink from "../components/ui/LocalizedLink";

export default function NotFoundPage() {
    return (
        <div className="min-h-dvh-fallback bg-background text-on-surface flex flex-col items-center justify-center px-6 py-24 text-center">
            <SEO title="Page not found" noindex />
            <p className="text-xs font-bold tracking-[0.12em] uppercase text-primary">
                404
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
                This page doesn't exist
            </h1>
            <p className="mt-3 max-w-md text-on-surface-variant">
                The link may be broken, or the page may have been moved.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <LocalizedLink
                    to="/"
                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary-container transition-opacity hover:opacity-90"
                >
                    Back to home
                </LocalizedLink>
                <LocalizedLink
                    to="/login"
                    className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:border-primary"
                >
                    Sign in
                </LocalizedLink>
            </div>
        </div>
    );
}
