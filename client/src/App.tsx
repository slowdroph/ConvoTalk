import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { SocketProvider } from "./providers/SocketProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import ChatSkeleton from "./components/Skeletons/ChatSkeleton";
import SettingsSkeleton from "./components/Skeletons/SettingsSkeleton";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));

function LoadingScreen() {
    return (
        <div className="h-dvh-fallback bg-zinc-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm">Carregando...</p>
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
                        path="/chat"
                        element={
                            <PrivateRoute>
                                <Suspense fallback={<ChatSkeleton />}>
                                    <ChatPage />
                                </Suspense>
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <PrivateRoute>
                                <Suspense fallback={<SettingsSkeleton />}>
                                    <SettingsPage />
                                </Suspense>
                            </PrivateRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    );
}
