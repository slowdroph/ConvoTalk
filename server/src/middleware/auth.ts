import { Request, Response, NextFunction } from "express";
import { AuthUser } from "../types";
import { verifyAccessToken } from "../services/token";
import { sendError } from "../utils/errors";

export interface AuthRequest extends Request {
    user?: AuthUser;
}

const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        sendError(
            res,
            401,
            "UNAUTHORIZED",
            "Acesso negado. Token não fornecido.",
        );
        return;
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = { _id: decoded.userId };
        next();
    } catch {
        sendError(res, 401, "UNAUTHORIZED", "Token inválido.");
    }
};

export default auth;
