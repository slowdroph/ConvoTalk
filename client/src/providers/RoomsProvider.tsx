import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { RoomsContext } from "../contexts/RoomsContext";
import type { MentionNotificationPayload, Message, Room } from "../types";

function unreadFromRooms(
    rooms: Room[],
    key: "unreadCount" | "mentionUnreadCount",
): Record<string, number> {
    return rooms.reduce<Record<string, number>>((acc, room) => {
        const value = room[key];
        if (value) acc[room._id] = value;
        return acc;
    }, {});
}

function withoutKey(
    counts: Record<string, number>,
    roomId: string,
): Record<string, number> {
    if (!counts[roomId]) return counts;
    const next = { ...counts };
    delete next[roomId];
    return next;
}

export function RoomsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { socket, connected } = useSocket();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [activeRoom, setActiveRoomState] = useState<string | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(
        {},
    );
    const [mentionUnreadCounts, setMentionUnreadCounts] = useState<
        Record<string, number>
    >({});
    const [roomsLoading, setRoomsLoading] = useState(true);
    const [roomsError, setRoomsError] = useState<string | null>(null);

    const roomsRef = useRef<Room[]>([]);
    const activeRoomRef = useRef<string | null>(null);
    const initialLoadRef = useRef(false);
    const firstConnectRef = useRef(true);

    useEffect(() => {
        roomsRef.current = rooms;
    }, [rooms]);

    useEffect(() => {
        activeRoomRef.current = activeRoom;
    }, [activeRoom]);

    const loadRooms = useCallback(async () => {
        setRoomsError(null);
        setRoomsLoading(true);
        try {
            const { data } = await api.get<Room[]>("/rooms");
            roomsRef.current = data;
            setRooms(data);
            setUnreadCounts(unreadFromRooms(data, "unreadCount"));
            setMentionUnreadCounts(
                unreadFromRooms(data, "mentionUnreadCount"),
            );
            return data;
        } catch {
            setRoomsError("Erro ao carregar salas. Verifique sua conexão.");
            return [];
        } finally {
            setRoomsLoading(false);
        }
    }, []);

    const setActiveRoom = useCallback((roomId: string | null) => {
        setActiveRoomState(roomId);
    }, []);

    const markRoomRead = useCallback((roomId: string) => {
        setUnreadCounts((prev) => withoutKey(prev, roomId));
        setMentionUnreadCounts((prev) => withoutKey(prev, roomId));
    }, []);

    const removeRoom = useCallback((roomId: string) => {
        const remaining = roomsRef.current.filter((room) => room._id !== roomId);
        roomsRef.current = remaining;
        setRooms(remaining);
        setActiveRoomState((current) =>
            current === roomId ? (remaining[0]?._id ?? null) : current,
        );
        setUnreadCounts((prev) => withoutKey(prev, roomId));
        setMentionUnreadCounts((prev) => withoutKey(prev, roomId));
    }, []);

    const updateRoom = useCallback((room: Room) => {
        setRooms((prev) =>
            prev.map((item) =>
                item._id === room._id ? { ...item, ...room } : item,
            ),
        );
    }, []);

    useEffect(() => {
        if (initialLoadRef.current) return;
        initialLoadRef.current = true;
        void loadRooms();
    }, [loadRooms]);

    useEffect(() => {
        if (!connected) return;
        if (firstConnectRef.current) {
            firstConnectRef.current = false;
            return;
        }
        void loadRooms();
    }, [connected, loadRooms]);

    useEffect(() => {
        if (!socket) return;

        const handleRoomDeleted = (roomId: string) => {
            removeRoom(roomId);
        };
        const handleRoomUpdated = (updatedRoom: Room) => {
            if (!updatedRoom?._id) return;
            updateRoom(updatedRoom);
        };

        socket.on("room_deleted", handleRoomDeleted);
        socket.on("room_updated", handleRoomUpdated);

        return () => {
            socket.off("room_deleted", handleRoomDeleted);
            socket.off("room_updated", handleRoomUpdated);
        };
    }, [socket, removeRoom, updateRoom]);

    useEffect(() => {
        if (!socket || !user) return;

        const handleMessage = (message: Message) => {
            if (message.type === "system") return;
            if (message.sender && message.sender._id === user._id) return;
            if (message.room === activeRoomRef.current) return;
            setUnreadCounts((prev) => ({
                ...prev,
                [message.room]: (prev[message.room] ?? 0) + 1,
            }));
        };

        const handleMention = (payload: MentionNotificationPayload) => {
            if (payload.roomId === activeRoomRef.current) return;
            setMentionUnreadCounts((prev) => ({
                ...prev,
                [payload.roomId]: (prev[payload.roomId] ?? 0) + 1,
            }));
        };

        socket.on("message", handleMessage);
        socket.on("mention:new", handleMention);

        return () => {
            socket.off("message", handleMessage);
            socket.off("mention:new", handleMention);
        };
    }, [socket, user]);

    const totalUnread = useMemo(
        () => Object.values(unreadCounts).reduce((total, count) => total + count, 0),
        [unreadCounts],
    );

    const value = useMemo(
        () => ({
            rooms,
            roomsLoading,
            roomsError,
            activeRoom,
            unreadCounts,
            mentionUnreadCounts,
            totalUnread,
            loadRooms,
            setActiveRoom,
            markRoomRead,
            removeRoom,
            updateRoom,
        }),
        [
            rooms,
            roomsLoading,
            roomsError,
            activeRoom,
            unreadCounts,
            mentionUnreadCounts,
            totalUnread,
            loadRooms,
            setActiveRoom,
            markRoomRead,
            removeRoom,
            updateRoom,
        ],
    );

    return (
        <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>
    );
}
