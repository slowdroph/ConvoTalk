import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { getErrorMessage } from "../utils/errors";

export default function ConfirmEmailChangePage() {
    const { t } = useTranslation("auth");
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
        token ? "idle" : "error",
    );
    const [message, setMessage] = useState(
        token ? "" : t("confirmEmailChange.missingToken"),
    );

    const handleConfirm = async () => {
        if (!token) return;
        setStatus("loading");

        try {
            await api.post("/user/confirm-email-change", {
                token,
            });
            setStatus("success");
            setMessage(t("confirmEmailChange.successMessage"));
        } catch (err: unknown) {
            setStatus("error");
            setMessage(getErrorMessage(err, t("confirmEmailChange.error")));
        }
    };

    return (
        <div className="min-h-dvh-fallback bg-zinc-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-zinc-900 rounded-2xl p-8 shadow-xl border border-zinc-800 text-center space-y-4">
                    {status === "loading" && (
                        <>
                            <div
                                role="status"
                                aria-label={t("confirmEmailChange.loading")}
                                className="w-16 h-16 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"
                            />
                            <h1 className="text-white text-lg font-semibold">
                                {t("confirmEmailChange.loading")}
                            </h1>
                        </>
                    )}

                    {status === "idle" && (
                        <>
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                                <svg
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-8 w-8 text-zinc-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-white text-lg font-semibold">
                                {t("confirmEmailChange.title")}
                            </h1>
                            <p className="text-zinc-400 text-sm">
                                {t("confirmEmailChange.instructions")}
                            </p>
                            <button
                                onClick={handleConfirm}
                                className="block w-full py-3 bg-green-600 hover:bg-green-700 text-on-accent font-medium rounded-lg transition-colors text-sm cursor-pointer"
                            >
                                {t("confirmEmailChange.confirm")}
                            </button>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                                <svg
                                    aria-hidden="true"
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
                            <h1 className="text-white text-lg font-semibold">
                                {t("confirmEmailChange.successTitle")}
                            </h1>
                            <p className="text-zinc-400 text-sm">{message}</p>
                            <Link
                                to="/login"
                                className="block w-full py-3 bg-green-600 hover:bg-green-700 text-on-accent font-medium rounded-lg transition-colors text-sm"
                            >
                                {t("confirmEmailChange.goToLogin")}
                            </Link>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto">
                                <svg
                                    aria-hidden="true"
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
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-white text-lg font-semibold">
                                {t("confirmEmailChange.errorTitle")}
                            </h1>
                            <p className="text-zinc-400 text-sm">{message}</p>
                            <Link
                                to="/settings"
                                className="block w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors text-sm"
                            >
                                {t("confirmEmailChange.backToSettings")}
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
