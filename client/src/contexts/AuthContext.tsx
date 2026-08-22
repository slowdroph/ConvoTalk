import { createContext } from "react";
import type { User } from "../types";

export type { User };

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (
        name: string,
        email: string,
        password: string,
    ) => Promise<{ message: string }>;
    updateUser: (user: User) => void;
    logout: () => void;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
    undefined,
);
