import { useContext } from "react";
import { BottomNavContext } from "../contexts/BottomNavContext";
import type { BottomNavContextType } from "../contexts/BottomNavContext";

const fallback: BottomNavContextType = {
    hidden: false,
    manualHidden: false,
    toggleManual: () => {},
    setComposerActive: () => {},
};

export function useBottomNav(): BottomNavContextType {
    return useContext(BottomNavContext) ?? fallback;
}
