import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import multer from "multer";
import {
    AppError,
    ValidationError,
    toAppError,
    sendError,
} from "../utils/errors";
import { logger } from "../config/logger";

export function notFoundHandler(req: Request, res: Response): void {
    if (req.path.startsWith("/api")) {
        sendError(res, 404, "NOT_FOUND", "Rota não encontrada.");
        return;
    }
    res.status(404).send("Not Found");
}

export function errorHandler(
    error: unknown,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
): void {
    const requestId =
        (res.getHeader("X-Request-Id") as string | undefined) || "unknown";

    if (error instanceof AppError) {
        if (error.statusCode >= 500) {
            logger.error(
                {
                    requestId,
                    code: error.code,
                    message: error.message,
                    stack: error.stack,
                },
                "request error",
            );
        }
        sendError(
            res,
            error.statusCode,
            error.code,
            error.message,
            error.details,
        );
        return;
    }

    if (
        error instanceof SyntaxError &&
        (error as { type?: string }).type === "entity.parse.failed"
    ) {
        sendError(
            res,
            400,
            "BAD_REQUEST",
            "JSON inválido no corpo da requisição.",
        );
        return;
    }

    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            sendError(res, 400, "VALIDATION_ERROR", "Arquivo muito grande.");
            return;
        }
        sendError(res, 400, "BAD_REQUEST", "Erro no upload do arquivo.");
        return;
    }

    if (error instanceof mongoose.Error.ValidationError) {
        const appError = toAppError(error);
        sendError(res, 400, appError.code, appError.message, appError.details);
        return;
    }

    if (error instanceof mongoose.Error.CastError) {
        sendError(res, 400, "INVALID_ID", "Formato de dado inválido.");
        return;
    }

    const appError = toAppError(error);
    if (appError instanceof ValidationError) {
        sendError(res, 400, appError.code, appError.message, appError.details);
        return;
    }

    logger.error(
        {
            requestId,
            error,
            stack: error instanceof Error ? error.stack : undefined,
        },
        "erro não tratado",
    );
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Erro interno do servidor.");
}
