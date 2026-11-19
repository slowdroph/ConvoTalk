import { Outlet } from "react-router-dom";
import AppBottomNav from "../components/Navigation/AppBottomNav";
import AppRail from "../components/Navigation/AppRail";
import { RoomsProvider } from "../providers/RoomsProvider";

export default function AppLayout() {
    return (
        <RoomsProvider>
            <div className="flex h-dvh-fallback overflow-hidden bg-noir-base pt-[env(safe-area-inset-top)]">
                <AppRail />
                <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
                    <Outlet />
                </div>
                <AppBottomNav />
            </div>
        </RoomsProvider>
    );
}
