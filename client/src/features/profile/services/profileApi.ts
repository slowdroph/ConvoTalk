import api from "../../../services/api";
import type {
    Post,
    PostCursor,
    ProfileStats,
    PublicProfile,
    User,
} from "../../../types";

export interface ProfilePostsQuery {
    limit?: number;
    before?: string;
    beforeId?: string;
    media?: boolean;
    authored?: boolean;
}

export interface ProfilePostsResult {
    posts: Post[];
    nextCursor: PostCursor | null;
}

export async function getPublicProfile(
    userId: string,
): Promise<PublicProfile> {
    const { data } = await api.get<PublicProfile>(`/user/${userId}/profile`);
    return data;
}

export async function getProfilePosts(
    userId: string,
    params: ProfilePostsQuery = {},
): Promise<ProfilePostsResult> {
    const { data } = await api.get<ProfilePostsResult>(
        `/posts/user/${userId}`,
        { params },
    );
    return data;
}

export async function getProfileStats(
    userId: string,
): Promise<ProfileStats> {
    const { data } = await api.get<ProfileStats>(
        `/posts/profile/${userId}/stats`,
    );
    return data;
}

export interface AboutInput {
    bio: string;
    interests: string[];
    gender?: string;
    birthdate?: string | null;
    country?: string | null;
    city?: string | null;
    languages?: string[];
    languageLevels?: Record<string, string>;
    status?: string;
}

export async function updateAbout(input: AboutInput): Promise<User> {
    const { data } = await api.put<User>("/user/about", input);
    return data;
}

export async function blockUser(userId: string): Promise<void> {
    await api.post(`/user/${userId}/block`);
}

export async function unblockUser(userId: string): Promise<void> {
    await api.delete(`/user/${userId}/block`);
}

export async function updateAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await api.put<User>("/user/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

export async function removeAvatar(): Promise<User> {
    const { data } = await api.delete<User>("/user/avatar");
    return data;
}
