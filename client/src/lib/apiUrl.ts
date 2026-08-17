export const API_URL = (
    import.meta.env.VITE_API_URL as string | undefined
)?.replace(/\/$/, "");

export const BASE_URL = API_URL ? `${API_URL}/api` : "/api";

export const SOCKET_URL = API_URL || "";