import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../../../utils/errors";
import type { Post, ProfileStats, PublicProfile } from "../../../types";
import {
    getProfilePosts,
    getProfileStats,
    getPublicProfile,
} from "../services/profileApi";

function statusOf(err: unknown): number | undefined {
    if (err && typeof err === "object" && "response" in err) {
        return (err as { response?: { status?: number } }).response?.status;
    }
    return undefined;
}

interface ProfileSlice {
    userId: string;
    profile: PublicProfile | null;
    error: string | null;
    notFound: boolean;
}

interface StatsSlice {
    userId: string;
    stats: ProfileStats | null;
    loading: boolean;
}

export function useProfile(userId: string | null) {
    const { t } = useTranslation("profile");
    const [profileSlice, setProfileSlice] = useState<ProfileSlice | null>(null);
    const [statsSlice, setStatsSlice] = useState<StatsSlice | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!userId) return;

        let active = true;

        getPublicProfile(userId)
            .then((data) => {
                if (!active) return;
                setProfileSlice({
                    userId,
                    profile: data,
                    error: null,
                    notFound: false,
                });
            })
            .catch((err: unknown) => {
                if (!active) return;
                setProfileSlice({
                    userId,
                    profile: null,
                    notFound: statusOf(err) === 404,
                    error:
                        statusOf(err) === 404
                            ? null
                            : getErrorMessage(err, t("page.loadError")),
                });
            });

        getProfileStats(userId)
            .then((data) => {
                if (active) {
                    setStatsSlice({ userId, stats: data, loading: false });
                }
            })
            .catch(() => {
                if (active) {
                    setStatsSlice({ userId, stats: null, loading: false });
                }
            });

        return () => {
            active = false;
        };
    }, [userId, reloadKey, t]);

    const reload = useCallback(() => {
        setReloadKey((key) => key + 1);
    }, []);

    const refreshStats = useCallback(async () => {
        if (!userId) return;
        setStatsSlice({ userId, stats: null, loading: true });
        try {
            const data = await getProfileStats(userId);
            setStatsSlice({ userId, stats: data, loading: false });
        } catch {
            setStatsSlice({ userId, stats: null, loading: false });
        }
    }, [userId]);

    const currentProfile =
        profileSlice && profileSlice.userId === userId ? profileSlice : null;
    const currentStats =
        statsSlice && statsSlice.userId === userId ? statsSlice : null;

    return {
        profile: currentProfile?.profile ?? null,
        stats: currentStats?.stats ?? null,
        loading: Boolean(userId) && !currentProfile,
        statsLoading:
            Boolean(userId) && (!currentStats || currentStats.loading),
        error: currentProfile?.error ?? null,
        notFound: currentProfile?.notFound ?? false,
        refreshStats,
        reload,
    };
}

interface GallerySlice {
    userId: string;
    refreshKey: number;
    images: Post[];
    error: string | null;
}

export function useProfileGallery(userId: string | null, refreshKey = 0) {
    const { t } = useTranslation("profile");
    const [slice, setSlice] = useState<GallerySlice | null>(null);

    useEffect(() => {
        if (!userId) return;

        let active = true;

        getProfilePosts(userId, { limit: 12, media: true })
            .then((data) => {
                if (!active) return;
                setSlice({ userId, refreshKey, images: data.posts, error: null });
            })
            .catch((err: unknown) => {
                if (!active) return;
                setSlice({
                    userId,
                    refreshKey,
                    images: [],
                    error: getErrorMessage(err, t("gallery.loadError")),
                });
            });

        return () => {
            active = false;
        };
    }, [userId, refreshKey, t]);

    const current =
        slice && slice.userId === userId && slice.refreshKey === refreshKey
            ? slice
            : null;

    return {
        images: current?.images ?? [],
        loading: Boolean(userId) && !current,
        error: current?.error ?? null,
    };
}
