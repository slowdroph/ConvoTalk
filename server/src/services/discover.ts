import mongoose from "mongoose";
import type {
    DiscoverActivityWindow,
    DiscoverMode,
    DiscoverPagePayload,
    DiscoverSort,
    DiscoverUserPayload,
} from "../../../shared/types";
import {
    DISCOVER_USER_PROJECTION,
    DISCOVER_USER_SELECT,
} from "../constants";
import Room from "../models/Room";
import User from "../models/User";
import { getOnlineUserIds } from "../socket/onlineUsers";
import { getBlockedUserIds } from "../utils/blocked";
import { escapeRegex } from "../utils/regex";

export interface DiscoverQueryInput {
    q?: string;
    country?: string;
    city?: string;
    languages?: string[];
    interests?: string[];
    activeWithin?: DiscoverActivityWindow;
    sort: DiscoverSort;
    page: number;
    limit: number;
}

const ACTIVITY_WINDOW_MS: Record<DiscoverActivityWindow, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
};

const SORT_MAP: Record<DiscoverSort, Record<string, 1 | -1>> = {
    active: { lastSeen: -1, _id: -1 },
    recent: { createdAt: -1, _id: -1 },
    name: { name: 1, _id: 1 },
};

function toObjectIds(ids: string[]): mongoose.Types.ObjectId[] {
    return ids
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
}

function onlineObjectIds(): mongoose.Types.ObjectId[] {
    return toObjectIds(getOnlineUserIds());
}

export function buildDiscoverFilter(
    excludedIds: string[],
    query: DiscoverQueryInput,
    onlineIds: mongoose.Types.ObjectId[],
): Record<string, unknown> {
    const filter: Record<string, unknown> = {
        _id: { $nin: toObjectIds(excludedIds) },
    };
    const and: Record<string, unknown>[] = [];

    if (query.country) filter.country = query.country;

    if (query.city) {
        filter.city = new RegExp(`^${escapeRegex(query.city)}$`, "i");
    }

    if (query.q) {
        const raw = query.q.replace(/^#/, "").trim();
        if (query.q.startsWith("#")) {
            and.push({
                publicId: new RegExp(`^${escapeRegex(raw.toUpperCase())}`),
            });
        } else {
            and.push({
                $or: [
                    { name: new RegExp(escapeRegex(raw), "i") },
                    {
                        publicId: new RegExp(
                            `^${escapeRegex(raw.toUpperCase())}`,
                        ),
                    },
                ],
            });
        }
    }

    if (query.languages?.length) {
        filter.languages = { $all: query.languages };
    }

    if (query.interests?.length) {
        filter.interests = { $in: query.interests };
    }

    if (query.activeWithin) {
        const cutoff = new Date(
            Date.now() - ACTIVITY_WINDOW_MS[query.activeWithin],
        );
        and.push({
            $or: [
                { lastSeen: { $gte: cutoff } },
                { _id: { $in: onlineIds } },
            ],
        });
    }

    if (and.length) filter.$and = and;

    return filter;
}

function toPayload(doc: Record<string, unknown>): DiscoverUserPayload {
    const toIso = (value: unknown): string | null => {
        if (!value) return null;
        return new Date(value as string | Date).toISOString();
    };

    return {
        _id: String(doc._id),
        name: (doc.name as string) ?? "",
        publicId: (doc.publicId as string) ?? "",
        avatar: (doc.avatar as string) ?? "",
        status: (doc.status as string) ?? "",
        country: (doc.country as string) ?? "",
        city: (doc.city as string) ?? "",
        bio: (doc.bio as string) ?? "",
        interests: (doc.interests as string[]) ?? [],
        languages: (doc.languages as string[]) ?? [],
        languageLevels:
            (doc.languageLevels as Record<string, string>) ?? {},
        lastSeen: toIso(doc.lastSeen),
        createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
    };
}

function isFilteredQuery(query: DiscoverQueryInput): boolean {
    return Boolean(
        query.q ||
            query.country ||
            query.city ||
            query.languages?.length ||
            query.interests?.length ||
            query.activeWithin,
    );
}

async function getExcludedIds(
    viewerId: string,
    suggested: boolean,
): Promise<string[]> {
    const blocked = await getBlockedUserIds(viewerId);
    const ids = [viewerId, ...blocked];

    if (suggested) {
        const dmParticipants = await Room.distinct("participants", {
            type: "direct",
            participants: viewerId,
        });
        for (const participant of dmParticipants) {
            ids.push(participant.toString());
        }
    }

    return Array.from(new Set(ids));
}

export async function discoverUsers(
    viewerId: string,
    query: DiscoverQueryInput,
): Promise<DiscoverPagePayload> {
    const suggested = !isFilteredQuery(query);
    const mode: DiscoverMode = suggested ? "suggested" : "results";
    const excludedIds = await getExcludedIds(viewerId, suggested);
    const onlineIds = onlineObjectIds();
    const filter = buildDiscoverFilter(excludedIds, query, onlineIds);
    const skip = (query.page - 1) * query.limit;

    let docs: Record<string, unknown>[];

    if (query.sort === "active") {
        docs = await User.aggregate<Record<string, unknown>>([
            { $match: filter as never },
            { $addFields: { isOnline: { $in: ["$_id", onlineIds] } } },
            { $sort: { isOnline: -1, ...SORT_MAP.active } },
            { $skip: skip },
            { $limit: query.limit + 1 },
            { $project: DISCOVER_USER_PROJECTION },
        ]).allowDiskUse(true);
    } else {
        docs = await User.find(filter as never)
            .select(DISCOVER_USER_SELECT)
            .sort(SORT_MAP[query.sort])
            .skip(skip)
            .limit(query.limit + 1)
            .lean<Record<string, unknown>[]>();
    }

    const hasMore = docs.length > query.limit;

    return {
        mode,
        page: query.page,
        hasMore,
        users: docs.slice(0, query.limit).map(toPayload),
    };
}
