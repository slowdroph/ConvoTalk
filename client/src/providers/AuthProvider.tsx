import { useEffect, useState, useCallback, type ReactNode } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api, {
    setAccessToken,
    getAccessToken,
    setUnauthorizedHandler,
    refreshAccessToken,
    clearSessionFlag,
} from "../services/api";
import type { User } from "../contexts/AuthContext";

const SESSION_FLAG_KEY = "chat_has_session";

function getInitialUser(): User | null {
    try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

function hasSessionFlag(): boolean {
    return localStorage.getItem(SESSION_FLAG_KEY) === "1";
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(getInitialUser);
    const [token, setToken] = useState<string | null>(getAccessToken);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            setAccessToken(null);
            clearSessionFlag();
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
        });
    }, []);

    useEffect(() => {
        let cancelled = false;

        const validateSession = async () => {
            if (!hasSessionFlag()) {
                if (!cancelled) {
                    setLoading(false);
                }
                return;
            }

            try {
                const currentToken = await refreshAccessToken();
                if (!currentToken) {
                    throw new Error("Refresh failed");
                }
                setAccessToken(currentToken);
                const me = await api.get("/user/me");
                if (!cancelled) {
                    localStorage.setItem("user", JSON.stringify(me.data));
                    setUser(me.data);
                    setToken(currentToken);
                }
            } catch {
                if (!cancelled) {
                    setAccessToken(null);
                    clearSessionFlag();
                    localStorage.removeItem("user");
                    setToken(null);
                    setUser(null);
                }
            }
        };

        validateSession().finally(() => {
            if (!cancelled) {
                setLoading(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const { data } = await api.post("/auth/login", { email, password });
        setAccessToken(data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem(SESSION_FLAG_KEY, "1");
        setToken(data.token);
        setUser(data.user);
    }, []);

    const register = useCallback(
        async (name: string, email: string, password: string) => {
            const { data } = await api.post("/auth/register", {
                name,
                email,
                password,
                acceptedTerms: true,
            });
            if (data.token) {
                setAccessToken(data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem(SESSION_FLAG_KEY, "1");
                setToken(data.token);
                setUser(data.user);
            }
            return data;
        },
        [],
    );

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // Ignora falhas na chamada de logout
        }
        setAccessToken(null);
        clearSessionFlag();
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    }, []);

    const updateUser = useCallback((updatedUser: User) => {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                register,
                updateUser,
                logout,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
