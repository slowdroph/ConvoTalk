import { lazy, Suspense, useLayoutEffect } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
    BrowserRouter,
    Navigate,
    Outlet,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";
import {
    DEFAULT_LANGUAGE,
    normalizeLanguage,
    type LanguageCode,
} from "@shared/i18n";
import i18n from "./i18n";
import { languageFromPath, stripLocale } from "./i18n/routing";
import { useAuth } from "./hooks/useAuth";
import { SocketProvider } from "./providers/SocketProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import ChatSkeleton from "./components/Skeletons/ChatSkeleton";
import SettingsSkeleton from "./components/Skeletons/SettingsSkeleton";
import AppLayout from "./layouts/AppLayout";
import NotFoundPage from "./pages/NotFoundPage";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ConfirmEmailChangePage = lazy(
    () => import("./pages/ConfirmEmailChangePage"),
);
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const FeedPage = lazy(() => import("./pages/FeedPage"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));

function LoadingScreen() {
    const { t } = useTranslation("common");
    return (
        <div className="h-dvh-fallback bg-zinc-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm">{t("actions.loading")}</p>
            </div>
        </div>
    );
}

function page(node: ReactNode) {
    return <Suspense fallback={<LoadingScreen />}>{node}</Suspense>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    return user ? (
        <SocketProvider>{children}</SocketProvider>
    ) : (
        <Navigate to="/login" />
    );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    return user ? <Navigate to="/chat" /> : <>{children}</>;
}

/** The URL is the source of truth for the language of public pages. */
function useRouteLanguage(language: LanguageCode) {
    useLayoutEffect(() => {
        const current = normalizeLanguage(
            i18n.resolvedLanguage || i18n.language,
        );
        if (current === language) return;
        void i18n.changeLanguage(language);
    }, [language]);
}

function DefaultLocaleLayout() {
    useRouteLanguage(DEFAULT_LANGUAGE);
    return <Outlet />;
}

function LocaleLayout() {
    const { pathname } = useLocation();
    const language = languageFromPath(pathname);
    useRouteLanguage(language ?? DEFAULT_LANGUAGE);

    if (!language) return <NotFoundPage />;
    if (language === DEFAULT_LANGUAGE) {
        return <Navigate to={stripLocale(pathname)} replace />;
    }
    return <Outlet />;
}

export default function App() {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Routes>
                    {/* Public pages, default locale (unprefixed). */}
                    <Route element={<DefaultLocaleLayout />}>
                        <Route path="/" element={page(<HomePage />)} />
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>{page(<LoginPage />)}</PublicRoute>
                            }
                        />
                        <Route
                            path="/terms"
                            element={page(<TermsPage />)}
                        />
                        <Route
                            path="/privacy"
                            element={page(<PrivacyPage />)}
                        />
                        <Route
                            path="/forgot-password"
                            element={page(<ForgotPasswordPage />)}
                        />
                    </Route>

                    {/* Public pages, locale-prefixed (/es, /pt-br, /fr). */}
                    <Route path=":locale" element={<LocaleLayout />}>
                        <Route index element={page(<HomePage />)} />
                        <Route
                            path="login"
                            element={
                                <PublicRoute>{page(<LoginPage />)}</PublicRoute>
                            }
                        />
                        <Route path="terms" element={page(<TermsPage />)} />
                        <Route path="privacy" element={page(<PrivacyPage />)} />
                        <Route
                            path="forgot-password"
                            element={page(<ForgotPasswordPage />)}
                        />
                    </Route>

                    {/* Account flows: never indexed, never locale-prefixed. */}
                    <Route
                        path="/verify-email"
                        element={page(<VerifyEmailPage />)}
                    />
                    <Route
                        path="/confirm-email-change"
                        element={page(<ConfirmEmailChangePage />)}
                    />
                    <Route
                        path="/reset-password"
                        element={page(<ResetPasswordPage />)}
                    />

                    {/* Authenticated app. */}
                    <Route
                        element={
                            <PrivateRoute>
                                <AppLayout />
                            </PrivateRoute>
                        }
                    >
                        <Route
                            path="/chat/:roomId?"
                            element={
                                <Suspense fallback={<ChatSkeleton />}>
                                    <ChatPage />
                                </Suspense>
                            }
                        />
                        <Route path="/feed" element={page(<FeedPage />)} />
                        <Route
                            path="/discover"
                            element={page(<DiscoverPage />)}
                        />
                        <Route path="/profile" element={page(<ProfilePage />)} />
                        <Route
                            path="/profile/:userId"
                            element={page(<ProfilePage />)}
                        />
                        <Route
                            path="/settings"
                            element={
                                <Suspense fallback={<SettingsSkeleton />}>
                                    <SettingsPage />
                                </Suspense>
                            }
                        />
                    </Route>

                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    );
}
