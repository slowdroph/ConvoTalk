import { createContext } from "react";
import type { OnlineUserPayload } from "@shared/types";

export type OnlineUser = OnlineUserPayload;

export interface SocketContextType {
    socket: import("socket.io-client").Socket | null;
    onlineUsers: OnlineUser[];
    connected: boolean;
    reconnecting: boolean;
    reconnectAttempt: number;
    hasConnectedOnce: boolean;
}

export const SocketContext = createContext<SocketContextType | undefined>(
    undefined,
);
