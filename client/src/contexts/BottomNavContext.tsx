import { createContext } from "react";

export interface BottomNavContextType {
    hidden: boolean;
    manualHidden: boolean;
    toggleManual: () => void;
    setComposerActive: (active: boolean) => void;
}

export const BottomNavContext = createContext<BottomNavContextType | undefined>(
    undefined,
);
