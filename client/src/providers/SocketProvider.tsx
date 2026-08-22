import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { SocketContext, type OnlineUser } from "../contexts/SocketContext";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";
import { getAccessToken } from "../services/api";
import { SOCKET_URL } from "../lib/apiUrl";

export function SocketProvider({ children }: { children: ReactNode }) {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [connected, setConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
    const wasConnected = useRef(false);

    useEffect(() => {
        if (!token) return;

        const newSocket = io(SOCKET_URL || "/", {
            auth: { token: token || getAccessToken() },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 20,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 30000,
            randomizationFactor: 0.5,
        });

        newSocket.on("connect", async () => {
            setConnected(true);
            setReconnecting(false);
            setReconnectAttempt(0);
            setHasConnectedOnce(true);
            if (wasConnected.current) {
                showToast({
                    type: "success",
                    message: "Conexão restabelecida de volta.",
                });
            }
            wasConnected.current = true;
            try {
                const { data } = await api.get("/rooms");
                for (const room of data) {
                    newSocket.emit("join", room._id);
                }
            } catch {
                // ignore
            }
        });
        newSocket.on("disconnect", (reason) => {
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
                message: "Não foi possível reconectar. Verifique sua conexão.",
            });
        });
        newSocket.on("user_online", (users: OnlineUser[]) =>
            setOnlineUsers(users),
        );

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            setSocket(null);
            setConnected(false);
            setReconnecting(false);
            setReconnectAttempt(0);
            setOnlineUsers([]);
            setHasConnectedOnce(false);
            wasConnected.current = false;
        };
    }, [token, showToast]);

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
