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
