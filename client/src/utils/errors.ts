import i18n from "../i18n";

interface ErrorResponseData {
    message?: string;
    error?: {
        code?: string;
        message?: string;
    };
}

export function getErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as {
            response?: {
                data?: ErrorResponseData;
            };
            isAxiosError?: boolean;
        };
        const data = axiosErr.response?.data;
        const code = data?.error?.code;

        if (code) {
            const key = `errors:${code}`;
            if (i18n.exists(key)) return i18n.t(key);
        }

        return data?.error?.message || data?.message || fallback;
    }

    if (
        err &&
        typeof err === "object" &&
        (err as { isAxiosError?: boolean }).isAxiosError
    ) {
        const key = "errors:NETWORK_ERROR";
        if (i18n.exists(key)) return i18n.t(key);
    }

    if (err instanceof Error) return err.message;
    return fallback;
}
