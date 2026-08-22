export function getErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as {
            response?: {
                data?: { message?: string; error?: { message?: string } };
            };
        };
        const data = axiosErr.response?.data;
        return data?.error?.message || data?.message || fallback;
    }
    if (err instanceof Error) return err.message;
    return fallback;
}
