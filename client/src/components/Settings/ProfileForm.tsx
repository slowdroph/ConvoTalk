import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";

export default function ProfileForm() {
    const { t } = useTranslation("settings");
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);

    const canEditName = Boolean(user?.verified);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setProfileLoading(true);

        const emailChanged =
            email.toLowerCase() !== (user?.email || "").toLowerCase();

        try {
            const { data } = await api.put("/user/profile", {
                name,
                email,
                currentPassword: emailChanged ? currentPassword : "",
            });
            updateUser(data);
            if (emailChanged) {
                setCurrentPassword("");
                if (data.pendingEmail) {
                    setSuccess(
                        t("profile.emailChangeSuccess", {
                            email: data.pendingEmail,
                        }),
                    );
                    setEmail(user?.email || "");
                } else {
                    setSuccess(
                        t("profile.emailChangeVerify", {
                            email: data.email || email,
                        }),
                    );
                    setEmail(data.email || email);
                }
            } else {
                setSuccess(t("profile.success"));
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, t("profile.error")));
        } finally {
            setProfileLoading(false);
        }
    };

    const emailChanged =
        email.toLowerCase() !== (user?.email || "").toLowerCase();

    return (
        <div className="space-y-6">
            <div className="border-b border-noir-border pb-4">
                <h2 className="text-base font-semibold text-noir-text-bright">
                    {t("profile.title")}
                </h2>
                <p className="text-xs text-noir-text-muted mt-0.5">
                    {t("profile.description")}
                </p>
            </div>

            {user?.emailPending && user.pendingEmail && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-3 rounded-xl text-xs flex items-start gap-2">
                    <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                        {t("profile.pendingPrefix")}{" "}
                        <strong className="text-amber-200">{user.pendingEmail}</strong>
                        {t("profile.pendingSuffix")}
                    </span>
                </div>
            )}

            {success && (
                <div role="alert" className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{success}</span>
                </div>
            )}

            {error && (
                <div role="alert" className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                <div>
                    <label
                        htmlFor="input-nome"
                        className="block text-xs font-medium text-noir-text-bright mb-1.5"
                    >
                        {t("profile.name")}
                    </label>
                    <input
                        type="text"
                        id="input-nome"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={50}
                        disabled={!canEditName}
                        className="w-full bg-noir-surface-alt border border-noir-border rounded-xl px-3.5 py-2.5 text-sm text-noir-text-bright focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    {!canEditName && (
                        <p className="mt-1.5 text-[11px] text-noir-text-muted">
                            {t("profile.nameLocked")}
                        </p>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label
                            htmlFor="input-email"
                            className="block text-xs font-medium text-noir-text-bright"
                        >
                            {t("profile.email")}
                        </label>
                        {user?.verified ? (
                            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {t("profile.verified")}
                            </span>
                        ) : (
                            <span className="text-[11px] text-amber-400 font-medium">
                                {t("profile.unverified")}
                            </span>
                        )}
                    </div>
                    <input
                        type="email"
                        id="input-email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        maxLength={100}
                        className="w-full bg-noir-surface-alt border border-noir-border rounded-xl px-3.5 py-2.5 text-sm text-noir-text-bright focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    />
                </div>

                {emailChanged && (
                    <div className="p-3.5 rounded-xl border border-noir-border bg-noir-surface-alt space-y-2">
                        <label
                            htmlFor="currentPassword"
                            className="block text-xs font-medium text-noir-text-bright"
                        >
                            {t("profile.currentPassword")}
                        </label>
                        <input
                            type="password"
                            name="currentPassword"
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            placeholder={t("profile.currentPasswordPlaceholder")}
                            className="w-full bg-noir-surface-alt border border-noir-border rounded-xl px-3.5 py-2 text-sm text-noir-text-bright focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                        />
                        <p className="text-[11px] text-noir-text-muted">
                            {t("profile.emailHint")}
                        </p>
                    </div>
                )}

                <div className="pt-1">
                    <button
                        type="submit"
                        disabled={profileLoading}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs tracking-wide shadow-md shadow-emerald-500/20 transition hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        {profileLoading ? t("profile.saving") : t("profile.save")}
                    </button>
                </div>
            </form>
        </div>
    );
}
