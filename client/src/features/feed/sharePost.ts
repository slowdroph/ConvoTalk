import type { Post } from "../../types";

export type SharePostResult = "shared" | "copied" | "dismissed";

export function buildPostUrl(postId: string): string {
    const origin =
        typeof window !== "undefined" && window.location.origin
            ? window.location.origin
            : "";
    return `${origin}/feed?post=${postId}`;
}

export async function sharePost(post: Post): Promise<SharePostResult> {
    const url = buildPostUrl(post._id);
    const title = post.author?.name
        ? `Post de ${post.author.name} no ConvoTalk`
        : "Post no ConvoTalk";

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
            await navigator.share({
                title,
                text: post.content.slice(0, 200),
                url,
            });
            return "shared";
        } catch (error) {
            if ((error as { name?: string })?.name === "AbortError") {
                return "dismissed";
            }
        }
    }

    if (!navigator.clipboard) {
        throw new Error("Compartilhamento indisponível.");
    }

    await navigator.clipboard.writeText(url);
    return "copied";
}
