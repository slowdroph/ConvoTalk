import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../contexts/ToastContext";
import { getErrorMessage } from "../../../utils/errors";
import type { PublicProfile } from "../../../types";
import { updateAbout, type AboutInput } from "../services/profileApi";

export type ProfileSection =
    | "bio"
    | "interests"
    | "status"
    | "details"
    | "languages";

export interface ProfileSectionEditor {
    active: ProfileSection | null;
    saving: boolean;
    error: string | null;
    start: (section: ProfileSection) => void;
    cancel: () => void;
    save: (patch: Partial<AboutInput>) => Promise<boolean>;
    isEditing: (section: ProfileSection) => boolean;
}

export function toAboutInput(
    profile: PublicProfile,
    patch: Partial<AboutInput> = {},
): AboutInput {
    const hasLanguages = Boolean(profile.languages?.length);

    return {
        bio: profile.bio ?? "",
        interests: profile.interests ?? [],
        gender: profile.gender || undefined,
        birthdate: profile.birthdate ? profile.birthdate.slice(0, 10) : null,
        country: profile.country || null,
        city: profile.city || null,
        languages: hasLanguages ? profile.languages : undefined,
        languageLevels: hasLanguages ? profile.languageLevels : undefined,
        status: profile.status ?? "",
        ...patch,
    };
}

export function useProfileSectionEditor(
    profile: PublicProfile | null,
    onSaved?: () => void | Promise<void>,
): ProfileSectionEditor {
    const { updateUser } = useAuth();
    const { showToast } = useToast();
    const [active, setActive] = useState<ProfileSection | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const start = (section: ProfileSection) => {
        setError(null);
        setActive(section);
    };

    const cancel = () => {
        setError(null);
        setActive(null);
    };

    const save = async (patch: Partial<AboutInput>) => {
        if (!profile || saving) return false;

        setSaving(true);
        setError(null);
        try {
            const updated = await updateAbout(toAboutInput(profile, patch));
            updateUser(updated);
            showToast({ type: "success", message: "Perfil atualizado!" });
            setActive(null);
            await onSaved?.();
            return true;
        } catch (err) {
            const message = getErrorMessage(
                err,
                "Erro ao atualizar o perfil.",
            );
            setError(message);
            showToast({ type: "error", message });
            return false;
        } finally {
            setSaving(false);
        }
    };

    return {
        active,
        saving,
        error,
        start,
        cancel,
        save,
        isEditing: (section) => active === section,
    };
}
