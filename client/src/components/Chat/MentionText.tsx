import { parseMentionTokens, type MentionParticipant } from "@shared/mentions";
import type { User } from "../../types";

interface MentionTextProps {
    content: string;
    participants: User[];
    searchQuery?: string;
}

export default function MentionText({ content, participants, searchQuery }: MentionTextProps) {
    if (!content) return null;

    const mentionParticipants: MentionParticipant[] = participants.map((p) => ({
        _id: p._id,
        name: p.name,
    }));

    const tokens = parseMentionTokens(content, mentionParticipants);

    if (tokens.length === 0) {
        return searchQuery ? (
            <HighlightedText text={content} query={searchQuery} />
        ) : (
            <span>{content}</span>
        );
    }

    const segments: React.ReactNode[] = [];
    let lastEnd = 0;

    for (const token of tokens) {
        if (token.start > lastEnd) {
            const plainText = content.slice(lastEnd, token.start);
            segments.push(
                searchQuery ? (
                    <HighlightedText key={lastEnd} text={plainText} query={searchQuery} />
                ) : (
                    <span key={lastEnd}>{plainText}</span>
                ),
            );
        }

        segments.push(
            <span
                key={token.userId}
                className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium text-sm cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                title={`@${token.name}`}
            >
                @{token.name}
            </span>,
        );
        lastEnd = token.end;
    }

    if (lastEnd < content.length) {
        const plainText = content.slice(lastEnd);
        segments.push(
            searchQuery ? (
                <HighlightedText key={lastEnd} text={plainText} query={searchQuery} />
            ) : (
                <span key={lastEnd}>{plainText}</span>
            ),
        );
    }

    return <span className="whitespace-pre-wrap break-words">{segments}</span>;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
    if (!query || !text) return <span>{text}</span>;

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-slate-900 dark:text-yellow-100 rounded px-[1px]">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                ),
            )}
        </span>
    );
}