import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { SocketProvider } from "./providers/SocketProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import ChatSkeleton from "./components/Skeletons/ChatSkeleton";
import SettingsSkeleton from "./components/Skeletons/SettingsSkeleton";
import AppLayout from "./layouts/AppLayout";

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

export default function App() {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <Suspense fallback={<LoadingScreen />}>
                                <HomePage />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <Suspense fallback={<LoadingScreen />}>
                                    <LoginPage />
                                </Suspense>
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/verify-email"
                        element={
                            <Suspense fallback={<LoadingScreen />}>
                                <VerifyEmailPage />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/confirm-email-change"
                        element={
                            <Suspense fallback={<LoadingScreen />}>
                                <ConfirmEmailChangePage />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/forgot-password"
                        element={
                            <Suspense fallback={<LoadingScreen />}>
                                <ForgotPasswordPage />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/reset-password"
                        element={
                            <Suspense fallback={<LoadingScreen />}>
                                <ResetPasswordPage />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/terms"
                        element={
                            <Suspense fallback={<LoadingScreen />}>
                                <TermsPage />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/privacy"
                        element={
                            <Suspense fallback={<LoadingScreen />}>
                                <PrivacyPage />
                            </Suspense>
                        }
                    />
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
                        <Route
                            path="/feed"
                            element={
                                <Suspense fallback={<LoadingScreen />}>
                                    <FeedPage />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <Suspense fallback={<LoadingScreen />}>
                                    <ProfilePage />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/profile/:userId"
                            element={
                                <Suspense fallback={<LoadingScreen />}>
                                    <ProfilePage />
                                </Suspense>
                            }
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
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    );
}
