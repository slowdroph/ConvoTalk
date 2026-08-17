import { useEffect, useState } from "react";
import api from "../../services/api";
import type { LinkPreview } from "../../types";

interface LinkPreviewCardProps {
    url: string;
}

const previewCache = new Map<string, LinkPreview>();

export default function LinkPreviewCard({ url }: LinkPreviewCardProps) {
    const [preview, setPreview] = useState<LinkPreview | null>(
        () => previewCache.get(url) ?? null,
    );
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        api.post("/links/preview", { url })
            .then(({ data }) => {
                if (!cancelled) {
                    previewCache.set(url, data);
                    setPreview(data);
                }
            })
            .catch(() => {
                if (!cancelled) setError(true);
            });
        return () => {
            cancelled = true;
        };
    }, [url]);

    if (error || !preview) return null;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700/80 transition-colors max-w-full sm:max-w-72"
        >
            {preview.image && (
                <img
                    src={preview.image}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                    }}
                    className="w-full h-32 object-cover"
                />
            )}
            <div className="p-2 min-w-0">
                <p className="text-xs text-zinc-400 truncate">
                    {new URL(preview.url).hostname}
                </p>
                <p className="text-sm text-white font-medium truncate">
                    {preview.title}
                </p>
                {preview.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2">
                        {preview.description}
                    </p>
                )}
            </div>
        </a>
    );
}
