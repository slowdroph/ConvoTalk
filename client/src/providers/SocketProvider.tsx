import {
    useState,
    useEffect,
    useMemo,
    useRef,
    useSyncExternalStore,
    type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import i18n from "../i18n";
import { SocketContext, type OnlineUser } from "../contexts/SocketContext";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../contexts/ToastContext";
import { getAccessToken } from "../services/api";
import { SOCKET_URL } from "../lib/apiUrl";

let currentSocket: Socket | null = null;
let socketListeners: Array<() => void> = [];

function emitSocketChange() {
    for (const listener of socketListeners) listener();
}

function subscribeSocket(cb: () => void) {
    socketListeners = [...socketListeners, cb];
    return () => {
        socketListeners = socketListeners.filter((l) => l !== cb);
    };
}

function getSocketSnapshot() {
    return currentSocket;
}

export function SocketProvider({ children }: { children: ReactNode }) {
    const { token, logout } = useAuth();
    const { showToast } = useToast();
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [connected, setConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
    const wasConnected = useRef(false);

    const socket = useSyncExternalStore(subscribeSocket, getSocketSnapshot);

    useEffect(() => {
        if (!token) return;

        let cancelled = false;
        let socket: Socket | null = null;

        // Loaded on demand so the realtime client stays out of the entry
        // chunk: public pages never open a socket.
        void import("socket.io-client").then(({ io }) => {
            if (cancelled) return;

            const newSocket = io(SOCKET_URL || "/", {
                auth: { token: token || getAccessToken() },
                transports: ["websocket", "polling"],
                reconnection: true,
                reconnectionAttempts: 20,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 30000,
                randomizationFactor: 0.5,
            });
            socket = newSocket;

            newSocket.on("connect", () => {
                setConnected(true);
                setReconnecting(false);
                setReconnectAttempt(0);
                setHasConnectedOnce(true);
                if (wasConnected.current) {
                    showToast({
                        type: "success",
                        message: i18n.t("chat:connection.restored"),
                    });
                }
                wasConnected.current = true;
            });
            newSocket.on("disconnect", (reason) => {
                if (!getAccessToken()) return;
                setConnected(false);
                setReconnecting(
                    reason === "io server disconnect" ||
                        reason === "io client disconnect"
                        ? false
                        : true,
                );
            });
            newSocket.on("reconnect_attempt", () => {
                const freshToken = getAccessToken();
                if (freshToken) {
                    newSocket.auth = { token: freshToken };
                }
                setReconnecting(true);
                setReconnectAttempt((prev) => prev + 1);
            });
            newSocket.on("reconnect_failed", () => {
                setReconnecting(false);
                setReconnectAttempt(0);
                showToast({
                    type: "error",
                    message: i18n.t("chat:connection.reconnectFailed"),
                });
            });
            newSocket.on("user_online", (users: OnlineUser[]) =>
                setOnlineUsers(users),
            );
            newSocket.on("session:force_logout", (data?: { reason?: string }) => {
                if (!getAccessToken()) return;
                const reasonKeys: Record<string, string> = {
                    password_changed: "chat:connection.sessionPasswordChanged",
                    email_changed: "chat:connection.sessionEmailChanged",
                    all_devices: "chat:connection.sessionAllDevices",
                    remote_logout: "chat:connection.sessionRemoteLogout",
                    session_expired: "chat:connection.sessionExpired",
                };
                const message = i18n.t(
                    (data?.reason && reasonKeys[data.reason]) ||
                        "chat:connection.sessionEnded",
                );
                showToast({ type: "warning", message });
                logout();
            });

            currentSocket = newSocket;
            emitSocketChange();
        });

        return () => {
            cancelled = true;
            socket?.disconnect();
            currentSocket = null;
            emitSocketChange();
            setConnected(false);
            setReconnecting(false);
            setReconnectAttempt(0);
            setOnlineUsers([]);
            setHasConnectedOnce(false);
            wasConnected.current = false;
        };
    }, [token, showToast, logout]);

    const value = useMemo(
        () => ({
            socket,
            onlineUsers,
            connected,
            reconnecting,
            reconnectAttempt,
            hasConnectedOnce,
        }),
        [
            socket,
            onlineUsers,
            connected,
            reconnecting,
            reconnectAttempt,
            hasConnectedOnce,
        ],
    );

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}
