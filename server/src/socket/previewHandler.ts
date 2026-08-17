import { Server as SocketIOServer, Socket, Namespace } from "socket.io";

interface PreviewMessage {
    id: string;
    senderId: string;
    name: string;
    content: string;
    createdAt: string;
}

const PREVIEW_ROOM = "preview";
const MAX_HISTORY = 50;
const MAX_CONTENT = 140;
const RATE_WINDOW_MS = 10_000;
const RATE_LIMIT = 12;

function formatMessage(
    senderId: string,
    name: string,
    content: string,
): PreviewMessage {
    return {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        senderId,
        name,
        content,
        createdAt: new Date().toISOString(),
    };
}

function sanitizeName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return "Visitante";
    return trimmed.slice(0, 30);
}

export default function previewHandler(io: SocketIOServer): void {
    const namespace: Namespace = io.of("/preview");

    const history: PreviewMessage[] = [];
    const online: Set<string> = new Set();
    const lastMessages: Map<string, number[]> = new Map();

    namespace.on("connection", (socket: Socket) => {
        socket.join(PREVIEW_ROOM);
        online.add(socket.id);
        namespace.to(PREVIEW_ROOM).emit("preview:online", online.size);

        socket.emit("preview:history", {
            messages: history,
            online: online.size,
        });

        socket.on("preview:message", (data: { content: string }, ack?: (res: { error?: string }) => void) => {
            const now = Date.now();
            const timestamps = (lastMessages.get(socket.id) || []).filter(
                (t) => now - t < RATE_WINDOW_MS,
            );
            if (timestamps.length >= RATE_LIMIT) {
                if (typeof ack === "function") {
                    ack({ error: "Você está enviando mensagens rápido demais. Aguarde um pouco." });
                }
                return;
            }
            timestamps.push(now);
            lastMessages.set(socket.id, timestamps);

            const content = typeof data?.content === "string" ? data.content.trim() : "";
            if (!content || content.length > MAX_CONTENT) {
                if (typeof ack === "function") {
                    ack({ error: `A mensagem deve ter entre 1 e ${MAX_CONTENT} caracteres.` });
                }
                return;
            }

            const name = sanitizeName(socket.handshake.auth?.name);
            const message = formatMessage(socket.id, name, content);

            history.push(message);
            if (history.length > MAX_HISTORY) {
                history.shift();
            }

            namespace.to(PREVIEW_ROOM).emit("preview:message", message);
            if (typeof ack === "function") {
                ack({});
            }
        });

        socket.on("preview:typing", (data: { name?: string; isTyping: boolean }) => {
            socket.to(PREVIEW_ROOM).emit("preview:typing", {
                name: sanitizeName(data?.name || ""),
                isTyping: Boolean(data?.isTyping),
            });
        });

        socket.on("disconnect", () => {
            online.delete(socket.id);
            lastMessages.delete(socket.id);
            namespace.to(PREVIEW_ROOM).emit("preview:online", online.size);
        });
    });
}
