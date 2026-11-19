export type ShareLinkResult = "shared" | "copied" | "cancelled" | "failed";

export interface ShareLinkInput {
    title: string;
    text?: string;
    url: string;
}

function isAbortError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as { name?: string }).name === "AbortError"
    );
}

export async function shareLink({
    title,
    text,
    url,
}: ShareLinkInput): Promise<ShareLinkResult> {
    if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
    ) {
        try {
            await navigator.share({ title, text, url });
            return "shared";
        } catch (error) {
            if (isAbortError(error)) return "cancelled";
        }
    }

    try {
        if (
            typeof navigator === "undefined" ||
            !navigator.clipboard?.writeText
        ) {
            return "failed";
        }
        await navigator.clipboard.writeText(url);
        return "copied";
    } catch {
        return "failed";
    }
}
