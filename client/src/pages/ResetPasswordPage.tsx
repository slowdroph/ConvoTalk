import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { getErrorMessage } from "../utils/errors";

export default function ResetPasswordPage() {
    const { t } = useTranslation("auth");
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        if (password !== confirmPassword) {
            setStatus("error");
            setMessage(t("reset.passwordsMismatch"));
            return;
        }

        if (!token) {
            setStatus("error");
            setMessage(t("reset.missingToken"));
            return;
        }

        try {
            await api.post("/auth/reset-password", {
                token,
                password,
            });
            setStatus("success");
            setMessage(t("reset.success"));
        } catch (err: unknown) {
            setStatus("error");
            setMessage(getErrorMessage(err, t("reset.error")));
        }
    };

    return (
        <div className="min-h-dvh-fallback bg-zinc-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <img
                        src="/logo-192.webp" width={192} height={163}
                        alt="ConvoTalk"
                        className="h-20 w-auto mx-auto mb-4 object-contain"
                    />
                    <h1 className="text-2xl font-bold text-white">ConvoTalk</h1>
                    <p className="text-zinc-500 mt-1">{t("reset.subtitle")}</p>
                </div>

                <div className="bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-800">
                    {status === "success" ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-8 w-8 text-on-accent"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <p className="text-zinc-300 text-sm">{message}</p>
                            <Link
                                to="/login"
                                className="block w-full py-3 bg-green-600 hover:bg-green-700 text-on-accent font-medium rounded-lg transition-colors text-sm"
                            >
                                {t("reset.goToLogin")}
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-zinc-400 text-sm">
                                {t("reset.instructions")}
                            </p>

                            {status === "error" && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
                                    {message}
                                </div>
                            )}

                            <input
                                type="password"
                                name="password"
                                id="password"
                                autoComplete="new-password"
                                placeholder={t("reset.newPassword")}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setStatus("idle");
                                    setMessage("");
                                }}
                                required
                                minLength={8}
                                maxLength={128}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                            />

                            <input
                                type="password"
                                name="confirmPassword"
                                id="confirmPassword"
                                autoComplete="new-password"
                                placeholder={t("reset.confirmPassword")}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setStatus("idle");
                                    setMessage("");
                                }}
                                required
                                minLength={8}
                                maxLength={128}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                            />

                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                            >
                                {status === "loading"
                                    ? t("reset.submitting")
                                    : t("reset.submit")}
                            </button>

                            <Link
                                to="/login"
                                className="block text-center text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                            >
                                {t("reset.backToLogin")}
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
