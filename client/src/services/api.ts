import axios from "axios";
import { BASE_URL } from "../lib/apiUrl";

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
    accessToken = token;
}

export function getAccessToken(): string | null {
    return accessToken;
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
    unauthorizedHandler = handler;
}

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

const SESSION_FLAG_KEY = "chat_has_session";

let refreshing: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
    if (!refreshing) {
        refreshing = axios
            .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
            .then((res) => {
                accessToken = res.data.token;
                localStorage.setItem(SESSION_FLAG_KEY, "1");
                return accessToken;
            })
            .catch(() => {
                accessToken = null;
                localStorage.removeItem(SESSION_FLAG_KEY);
                return null;
            })
            .finally(() => {
                refreshing = null;
            });
    }
    return refreshing;
}

export function clearSessionFlag(): void {
    localStorage.removeItem(SESSION_FLAG_KEY);
}

api.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        if (!error.response || !original) {
            return Promise.reject(error);
        }

        const url = original.url ?? "";
        const isAuthEndpoint = /^\/auth\//.test(url);

        if (
            error.response.status === 401 &&
            !original._retry &&
            !isAuthEndpoint
        ) {
            original._retry = true;
            const newToken = await refreshAccessToken();
            if (newToken) {
                original.headers.Authorization = `Bearer ${newToken}`;
                return api(original);
            }
            unauthorizedHandler?.();
            return Promise.reject(error);
        }

        if (error.response.status === 401 && url.includes("/auth/refresh")) {
            unauthorizedHandler?.();
        }

        return Promise.reject(error);
    },
);

export default api;
