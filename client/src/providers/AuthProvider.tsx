import { useEffect, useState, useCallback, type ReactNode } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api, {
    setAccessToken,
    getAccessToken,
    setUnauthorizedHandler,
} from "../services/api";
import type { User } from "../contexts/AuthContext";

function getInitialUser(): User | null {
    try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(getInitialUser);
    const [token, setToken] = useState<string | null>(getAccessToken);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            setAccessToken(null);
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
        });
    }, []);

    useEffect(() => {
        let cancelled = false;

        const validateSession = async () => {
            try {
                const { data } = await api.post(
                    "/auth/refresh",
                    {},
                    { withCredentials: true },
                );
                const currentToken = data.token;
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
