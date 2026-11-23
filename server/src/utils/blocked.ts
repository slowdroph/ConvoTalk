import User from "../models/User";

export async function areUsersBlocked(
    userA: string,
    userB: string,
): Promise<boolean> {
    const blocked = await User.exists({
        _id: { $in: [userA, userB] },
        blockedUsers: { $in: [userA, userB] },
    });
    return Boolean(blocked);
}

export async function getBlockedUserIds(userId: string): Promise<string[]> {
    const [me, blockedMe] = await Promise.all([
        User.findById(userId).select("blockedUsers").lean(),
        User.find({ blockedUsers: userId }).select("_id").lean(),
    ]);

    const ids = new Set<string>();
    for (const id of me?.blockedUsers ?? []) {
        ids.add(id.toString());
    }
    for (const user of blockedMe) {
        ids.add(user._id.toString());
    }
    return Array.from(ids);
}
