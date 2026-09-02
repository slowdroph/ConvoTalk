export interface MentionToken {
    start: number;
    end: number;
    userId: string;
    name: string;
}

export interface MentionParticipant {
    _id: string;
    name: string;
}

export function parseMentionTokens(
    content: string,
    participants: MentionParticipant[]
): MentionToken[] {
    if (!content.includes("@")) {
        return [];
    }

    const sortedParticipants = [...participants].sort(
        (a, b) => b.name.length - a.name.length
    );

    const tokens: MentionToken[] = [];
    let searchIndex = 0;

    while (true) {
        const atIndex = content.indexOf("@", searchIndex);
        if (atIndex === -1) {
            break;
        }

        const prevChar = atIndex > 0 ? content[atIndex - 1] : "";
        if (prevChar.match(/[\w]/)) {
            searchIndex = atIndex + 1;
            continue;
        }

        let matchedToken: MentionToken | null = null;

        for (const participant of sortedParticipants) {
            const name = participant.name;
            const nameLength = name.length;
            const endIndex = atIndex + 1 + nameLength;

            if (endIndex > content.length) {
                continue;
            }

            const candidate = content.slice(atIndex + 1, endIndex);
            if (candidate.toLowerCase() !== name.toLowerCase()) {
                continue;
            }

            const nextChar = endIndex < content.length ? content[endIndex] : "";
            if (nextChar && nextChar.match(/[\w]/)) {
                continue;
            }

            matchedToken = {
                start: atIndex,
                end: endIndex,
                userId: participant._id,
                name: name,
            };
            break;
        }

        if (matchedToken) {
            tokens.push(matchedToken);
            searchIndex = matchedToken.end;
        } else {
            searchIndex = atIndex + 1;
        }
    }

    return tokens;
}

export function getUniqueMentionUserIds(tokens: MentionToken[]): string[] {
    const seen = new Set<string>();
    return tokens.filter((t) => {
        if (seen.has(t.userId)) return false;
        seen.add(t.userId);
        return true;
    }).map((t) => t.userId);
}