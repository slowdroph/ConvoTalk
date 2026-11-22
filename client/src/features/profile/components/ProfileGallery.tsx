import { useTranslation } from "react-i18next";
import type { Post } from "../../../types";
import ImageLightbox from "../../../components/ui/ImageLightbox";

interface ProfileGalleryProps {
    images: Post[];
    loading: boolean;
    error: string | null;
}

export default function ProfileGallery({
    images,
    loading,
    error,
}: ProfileGalleryProps) {
    const { t } = useTranslation("profile");

    return (
        <section
            aria-label={t("gallery.aria")}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-noir-border dark:bg-noir-surface"
        >
            <div className="flex items-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
                <h2 className="text-base font-bold text-slate-900 dark:text-noir-text-bright">
                    {t("gallery.title")}
                </h2>
                {images.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-noir-surface-alt dark:text-noir-text-muted">
                        {images.length}
                    </span>
                )}
            </div>

            {loading ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="aspect-square animate-pulse rounded-lg bg-slate-200 dark:bg-noir-surface-alt"
                        />
                    ))}
                </div>
            ) : error ? (
                <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                    {error}
                </p>
            ) : images.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-noir-border dark:text-noir-text-muted">
                    {t("gallery.empty")}
                </p>
            ) : (
                <ul className="mt-3 grid grid-cols-3 gap-2">
                    {images.map((post) => (
                        <li key={post._id}>
                            {post.image && (
                                <ImageLightbox
                                    src={post.image.url}
                                    alt={
                                        post.content
                                            ? post.content.slice(0, 80)
                                            : t("gallery.imageFallback")
                                    }
                                    className="group relative block aspect-square w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-noir-border dark:bg-noir-surface-alt"
                                    imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
