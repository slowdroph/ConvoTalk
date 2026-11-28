import type { CSSProperties } from "react";
import { Outlet } from "react-router-dom";
import AppBottomNav from "../components/Navigation/AppBottomNav";
import AppRail from "../components/Navigation/AppRail";
import VerificationBanner from "../components/Auth/VerificationBanner";
import { RoomsProvider } from "../providers/RoomsProvider";
import { BottomNavProvider } from "../providers/BottomNavProvider";
import { useBottomNav } from "../hooks/useBottomNav";

const NAV_HEIGHT = "calc(4rem + env(safe-area-inset-bottom))";

function AppShell() {
    const { hidden } = useBottomNav();

    return (
        <div
            className="flex h-dvh-fallback overflow-hidden bg-noir-base pt-[env(safe-area-inset-top)]"
            style={
                {
                    "--app-bottom-nav-h": hidden ? "0px" : NAV_HEIGHT,
                } as CSSProperties
            }
        >
            <AppRail />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-[var(--app-bottom-nav-h)] transition-[padding-bottom] duration-200 ease-out lg:pb-0">
                <VerificationBanner />
                <div className="flex min-h-0 flex-1 flex-col">
                    <Outlet />
                </div>
            </div>
            <AppBottomNav />
        </div>
    );
}

export default function AppLayout() {
    return (
        <RoomsProvider>
            <BottomNavProvider>
                <AppShell />
            </BottomNavProvider>
        </RoomsProvider>
    );
}
