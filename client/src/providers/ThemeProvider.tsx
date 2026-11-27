import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { ThemeContext, type Theme } from "../contexts/ThemeContext";

const THEME_STORAGE_KEY = "convo-talk-theme";

function getInitialTheme(): Theme {
    if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "light" || stored === "dark") return stored;
    }
    return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute("data-theme", theme);
        root.style.colorScheme = theme;
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const firstRunRef = useRef(true);

    useEffect(() => {
        if (firstRunRef.current) {
            firstRunRef.current = false;
            return;
        }
        const root = document.documentElement;
        root.classList.add("theme-transition");
        const timeout = window.setTimeout(
            () => root.classList.remove("theme-transition"),
            300,
        );
        return () => window.clearTimeout(timeout);
    }, [theme]);

    const setTheme = useCallback((t: Theme) => setThemeState(t), []);
    const toggleTheme = useCallback(
        () => setThemeState((prev) => (prev === "dark" ? "light" : "dark")),
        [],
    );

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
