import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./providers/AuthProvider";
import { ToastProvider } from "./providers/ToastProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import App from "./App";
import CustomCursor from "./components/ui/CustomCursor";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <HelmetProvider>
            <ThemeProvider>
                <ToastProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                    <CustomCursor />
                </ToastProvider>
            </ThemeProvider>
        </HelmetProvider>
    </StrictMode>,
);

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
}
