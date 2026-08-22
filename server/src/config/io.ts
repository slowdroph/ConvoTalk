import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function setSocketIO(server: SocketIOServer): void {
    io = server;
}

export function getSocketIO(): SocketIOServer | null {
    return io;
}
