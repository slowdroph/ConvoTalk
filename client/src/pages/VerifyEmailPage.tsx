import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { getErrorMessage } from "../utils/errors";

export default function VerifyEmailPage() {
    const { t } = useTranslation("auth");
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">(
        token ? "loading" : "error",
    );
    const [message, setMessage] = useState(
        token ? "" : t("verify.missingToken"),
    );
    const called = useRef(false);

    useEffect(() => {
        if (!token || called.current) return;
        called.current = true;

        const verify = async () => {
            try {
                await api.get(`/auth/verify/${token}`);
                setStatus("success");
                setMessage(t("verify.successMessage"));
            } catch (err: unknown) {
                setStatus("error");
                setMessage(getErrorMessage(err, t("verify.error")));
            }
        };

        verify();
    }, [token, t]);

    return (
        <div className="min-h-dvh-fallback bg-zinc-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-zinc-900 rounded-2xl p-8 shadow-xl border border-zinc-800 text-center space-y-4">
                    {status === "loading" && (
                        <>
                            <div className="w-16 h-16 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <h1 className="text-white text-lg font-semibold">
                                {t("verify.loading")}
                            </h1>
                        </>
                    )}

                    {status === "success" && (
                        <>
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
                            <h1 className="text-white text-lg font-semibold">
                                {t("verify.successTitle")}
                            </h1>
                            <p className="text-zinc-400 text-sm">{message}</p>
                            <Link
                                to="/login"
                                className="block w-full py-3 bg-green-600 hover:bg-green-700 text-on-accent font-medium rounded-lg transition-colors text-sm"
                            >
                                {t("verify.goToLogin")}
                            </Link>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto">
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
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-white text-lg font-semibold">
                                {t("verify.errorTitle")}
                            </h1>
                            <p className="text-zinc-400 text-sm">{message}</p>
                            <Link
                                to="/login"
                                className="block w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors text-sm"
                            >
                                {t("verify.backToLogin")}
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
