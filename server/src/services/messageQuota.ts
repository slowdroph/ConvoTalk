import User from "../models/User";
import type { MessageQuotaPayload } from "../../../shared/types";

export const UNVERIFIED_DAILY_MESSAGE_LIMIT = 20;

interface QuotaFields {
    verified?: boolean | null;
    messageQuotaDate?: string | null;
    messageQuotaUsed?: number | null;
}

export function utcDayKey(date: Date = new Date()): string {
    return date.toISOString().slice(0, 10);
}

export function nextUtcMidnight(date: Date = new Date()): Date {
    return new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate() + 1,
        ),
    );
}

export function quotaSnapshot(user: QuotaFields): MessageQuotaPayload {
    const used =
        user.messageQuotaDate === utcDayKey()
            ? Math.max(0, user.messageQuotaUsed ?? 0)
            : 0;

    return {
        limit: UNVERIFIED_DAILY_MESSAGE_LIMIT,
        used,
        remaining: Math.max(0, UNVERIFIED_DAILY_MESSAGE_LIMIT - used),
        resetAt: nextUtcMidnight().toISOString(),
    };
}

export interface MessageQuotaState {
    verified: boolean;
    quota: MessageQuotaPayload | null;
}

export async function getMessageQuota(userId: string): Promise<MessageQuotaState> {
    const user = await User.findById(userId)
        .select("verified messageQuotaDate messageQuotaUsed")
        .lean<QuotaFields>();

    if (!user) {
        return { verified: false, quota: quotaSnapshot({}) };
    }

    return {
        verified: Boolean(user.verified),
        quota: user.verified ? null : quotaSnapshot(user),
    };
}

export interface ConsumeQuotaResult {
    allowed: boolean;
    verified: boolean;
    quota: MessageQuotaPayload | null;
}

/**
 * Atomically reserves one message for an unverified user.
 * The update only matches while the user is unverified and below the daily
 * limit, so concurrent requests can never exceed the quota.
 */
export async function consumeMessageQuota(
    userId: string,
): Promise<ConsumeQuotaResult> {
    const today = utcDayKey();

    const updated = await User.findOneAndUpdate(
        {
            _id: userId,
            verified: false,
            $expr: {
                $or: [
                    { $ne: [{ $ifNull: ["$messageQuotaDate", ""] }, today] },
                    {
                        $lt: [
                            { $ifNull: ["$messageQuotaUsed", 0] },
                            UNVERIFIED_DAILY_MESSAGE_LIMIT,
                        ],
                    },
                ],
            },
        },
        [
            {
                $set: {
                    messageQuotaDate: today,
                    messageQuotaUsed: {
                        $cond: [
                            {
                                $eq: [
                                    { $ifNull: ["$messageQuotaDate", ""] },
                                    today,
                                ],
                            },
                            { $add: [{ $ifNull: ["$messageQuotaUsed", 0] }, 1] },
                            1,
                        ],
                    },
                },
            },
        ],
        {
            returnDocument: "after",
            projection: { verified: 1, messageQuotaDate: 1, messageQuotaUsed: 1 },
            updatePipeline: true,
        },
    ).lean<QuotaFields | null>();

    if (updated) {
        return {
            allowed: true,
            verified: false,
            quota: quotaSnapshot(updated),
        };
    }

    const user = await User.findById(userId)
        .select("verified messageQuotaDate messageQuotaUsed")
        .lean<QuotaFields>();

    if (!user) {
        return { allowed: false, verified: false, quota: quotaSnapshot({}) };
    }

    if (user.verified) {
        return { allowed: true, verified: true, quota: null };
    }

    return {
        allowed: false,
        verified: false,
        quota: quotaSnapshot(user),
    };
}

/**
 * Returns a previously reserved message when creation fails.
 * The refund never crosses a day boundary.
 */
export async function refundMessageQuota(
    userId: string,
): Promise<MessageQuotaPayload | null> {
    const today = utcDayKey();

    await User.updateOne(
        {
            _id: userId,
            verified: false,
            messageQuotaDate: today,
            messageQuotaUsed: { $gt: 0 },
        },
        { $inc: { messageQuotaUsed: -1 } },
    );

    const state = await getMessageQuota(userId);
    return state.quota;
}
