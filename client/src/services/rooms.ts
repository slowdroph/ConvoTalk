import api from "./api";
import type { Room } from "../types";

export async function createDirectRoom(userId: string): Promise<Room> {
    const { data } = await api.post<Room>("/rooms/direct", { userId });
    return data;
}
