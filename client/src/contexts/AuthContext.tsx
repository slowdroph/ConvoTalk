import { createContext } from "react";
import type { User } from "../types";

export type { User };

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
    gender: string;
    birthdate: string;
    country: string;
    city: string;
    languages: string[];
    languageLevels: Record<string, string>;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (input: RegisterInput) => Promise<{ message: string }>;
    updateUser: (user: User) => void;
    logout: () => void;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
    undefined,
);
