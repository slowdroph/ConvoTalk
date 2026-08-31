import "dotenv/config";

import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";

import connectDB from "./config/db";
import { validateEnv, getAllowedOrigins } from "./config/env";
import authRoutes from "./routes/auth";
import messageRoutes from "./routes/messages";
import roomRoutes from "./routes/rooms";
import userRoutes from "./routes/user";
import usersSearchRoutes from "./routes/users";
import linkPreviewRoutes from "./routes/linkPreview";
import pushRoutes from "./routes/push";

import socketHandler from "./socket/socketHandler";
import previewHandler from "./socket/previewHandler";
import webrtcHandler from "./socket/webrtcHandler";
import { setSocketIO } from "./config/io";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { socketAuth } from "./middleware/socketAuth";
import { logger } from "./config/logger";
import { randomUUID } from "crypto";
import {
    generalLimiter,
    authLimiter,
    refreshLimiter,
    searchLimiter,
    previewLimiter,
    pushLimiter,
} from "./middleware/rateLimiter";
import { configureWebPush } from "./services/pushNotification";

validateEnv();
configureWebPush();

const ALLOWED_ORIGINS = getAllowedOrigins();
const corsOrigin =
    ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : ["http://localhost:5173"];

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : "loopback");

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: corsOrigin,
        credentials: true,
        methods: ["GET", "POST"],
    },
    pingInterval: 20_000,
    pingTimeout: 10_000,
    maxHttpBufferSize: 512e3,
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60_000,
    },
});

// Middleware
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
                connectSrc: ["'self'", "ws:", "wss:"],
                mediaSrc: ["'self'", "blob:", "data:", "https:", "http:"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
                objectSrc: ["'none'"],
                frameSrc: ["'none'"],
                frameAncestors: ["'none'"],
                formAction: ["'self'"],
                baseUri: ["'self'"],
                upgradeInsecureRequests: null,
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false,
    }),
);
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(cookieParser());
app.use(compression());
app.use(express.json({ limit: "100kb" }));
app.use(generalLimiter);

// Request logging com request ID
app.use((req, res, next) => {
    const requestId = randomUUID();
    res.setHeader("X-Request-Id", requestId);
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const level =
            res.statusCode >= 500
                ? "error"
                : res.statusCode >= 400
                  ? "warn"
                  : "info";
        logger[level](
            {
                requestId,
                method: req.method,
                path: req.originalUrl,
                status: res.statusCode,
                durationMs: duration,
                ip: req.ip,
            },
            "request",
        );
    });
    next();
});

// Rotas
app.use("/api/auth/refresh", refreshLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/user", userRoutes);
app.use("/api/users", searchLimiter, usersSearchRoutes);
app.use("/api/links", previewLimiter, linkPreviewRoutes);
app.use("/api/push", pushLimiter, pushRoutes);


app.get("/api/health/live", (_req, res) => {
    res.status(200).json({
        status: "ok",
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

app.get("/api/health", async (_req, res) => {
    const mongoStatus = (await import("mongoose")).default.connection
        .readyState;
    const mongoOk = mongoStatus === 1;
    res.status(mongoOk ? 200 : 503).json({
        status: mongoOk ? "ok" : "degraded",
        version: process.env.npm_package_version || "0.0.0",
        nodeEnv: process.env.NODE_ENV || "development",
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        mongodb: mongoOk ? "ok" : "error",
        socketio: io.engine.clientsCount,
        memory: {
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        },
    });
});

// Rota 404 JSON para API
app.use(notFoundHandler);

// Error handler (apÃ³s todas as rotas)
app.use(errorHandler);

// Socket.IO
setSocketIO(io);
io.use(socketAuth);
socketHandler(io);
previewHandler(io);
webrtcHandler(io);

// Iniciar servidor
const PORT = process.env.PORT || 3001;

const start = async () => {
    await connectDB();

    httpServer.listen(PORT, () => {
        logger.info({ port: PORT }, "Servidor iniciado");
    });
};

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, "Iniciando encerramento gracioso");
    const forceExit = setTimeout(() => {
        logger.error({ signal }, "Encerramento forÃ§ado por timeout");
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    try {
        io.close();
        await new Promise<void>((resolve) => {
            httpServer.close(() => resolve());
        });
        const mongoose = (await import("mongoose")).default;
        await mongoose.disconnect();
        logger.info({ signal }, "Encerramento concluÃ­do");
        process.exit(0);
    } catch (error) {
        logger.error({ signal, err: error }, "Erro durante o encerramento");
        process.exit(1);
    }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
    logger.error(
        { reason: reason instanceof Error ? reason.stack : reason },
        "unhandledRejection",
    );
    process.exit(1);
});

process.on("uncaughtException", (error) => {
    logger.error({ err: error.stack }, "uncaughtException");
    process.exit(1);
});

start();
