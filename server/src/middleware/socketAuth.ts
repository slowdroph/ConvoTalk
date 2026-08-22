import { Socket } from "socket.io";
import { verifyAccessToken } from "../services/token";

declare module "socket.io" {
    interface Socket {
        userId?: string;
    }
}

export function socketAuth(socket: Socket, next: (err?: Error) => void): void {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error("Autenticação necessária"));
    }

    try {
        const decoded = verifyAccessToken(token);
        socket.userId = decoded.userId;
        next();
    } catch {
        next(new Error("Token inválido"));
    }
}
