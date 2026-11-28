import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../contexts/ToastContext";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";

const RESEND_COOLDOWN_MS = 60_000;
const REFRESH_THROTTLE_MS = 30_000;

export default function VerificationBanner() {
    const { t } = useTranslation("auth");
    const { user, refreshUser } = useAuth();
    const { showToast } = useToast();
    const [resending, setResending] = useState(false);
    const [checking, setChecking] = useState(false);
    const [cooldown, setCooldown] = useState(false);
    const lastRefresh = useRef(0);
    const cooldownTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const unverified = Boolean(user && !user.verified);

    useEffect(() => {
        return () => {
            if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
        };
    }, []);

    const refreshIfDue = useCallback(() => {
        if (!unverified) return;
        const now = Date.now();
        if (now - lastRefresh.current < REFRESH_THROTTLE_MS) return;
        lastRefresh.current = now;
        void refreshUser();
    }, [refreshUser, unverified]);

    useEffect(() => {
        if (!unverified) return;

        const onVisibility = () => {
            if (document.visibilityState === "visible") refreshIfDue();
        };

        window.addEventListener("focus", refreshIfDue);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            window.removeEventListener("focus", refreshIfDue);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [refreshIfDue, unverified]);

    if (!user || user.verified) return null;

    const quota = user.messageQuota;
    const exhausted = Boolean(quota && quota.remaining <= 0);

    const handleResend = async () => {
        if (resending || cooldown) return;
        setResending(true);
        try {
            await api.post("/auth/resend-verification", { email: user.email });
            setCooldown(true);
            cooldownTimer.current = setTimeout(
                () => setCooldown(false),
                RESEND_COOLDOWN_MS,
            );
            showToast({
                type: "success",
                message: t("banner.resendSuccess"),
            });
        } catch (err: unknown) {
            showToast({
                type: "error",
                message: getErrorMessage(err, t("banner.resendError")),
            });
        } finally {
            setResending(false);
        }
    };

    const handleCheck = async () => {
        if (checking) return;
        setChecking(true);
        try {
            await refreshUser();
        } finally {
            setChecking(false);
        }
    };

    return (
        <div
            role="region"
            aria-label={t("banner.title")}
            className="flex flex-col gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-amber-800 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="min-w-0 space-y-0.5">
                <p className="text-xs font-semibold">{t("banner.title")}</p>
                <p className="text-[11px] leading-snug text-amber-700/90 dark:text-amber-200/80">
                    {exhausted
                        ? t("banner.limitReached")
                        : t("banner.description", {
                              limit: quota?.limit ?? 20,
                          })}
                </p>
                {quota && (
                    <p className="text-[11px] font-medium">
                        {t("banner.remaining", {
                            remaining: quota.remaining,
                            limit: quota.limit,
                        })}
                    </p>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => void handleResend()}
                    disabled={resending || cooldown}
                    className="rounded-lg border border-amber-600/40 bg-amber-500/15 px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {resending ? t("banner.resending") : t("banner.resend")}
                </button>
                <button
                    type="button"
                    onClick={() => void handleCheck()}
                    disabled={checking}
                    className="rounded-lg border border-amber-600/40 bg-transparent px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {checking
                        ? t("banner.checking")
                        : t("banner.alreadyConfirmed")}
                </button>
                <Link
                    to="/settings"
                    className="text-[11px] font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
                >
                    {t("banner.fixEmail")}
                </Link>
            </div>
        </div>
    );
}
