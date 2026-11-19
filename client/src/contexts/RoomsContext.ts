import { createContext } from "react";
import type { Room } from "../types";

export interface RoomsContextType {
    rooms: Room[];
    roomsLoading: boolean;
    roomsError: string | null;
    activeRoom: string | null;
    unreadCounts: Record<string, number>;
    mentionUnreadCounts: Record<string, number>;
    totalUnread: number;
    loadRooms: () => Promise<Room[]>;
    setActiveRoom: (roomId: string | null) => void;
    markRoomRead: (roomId: string) => void;
    removeRoom: (roomId: string) => void;
    updateRoom: (room: Room) => void;
}

export const RoomsContext = createContext<RoomsContextType | undefined>(
    undefined,
);
