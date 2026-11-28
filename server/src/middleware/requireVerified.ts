import type { NextFunction, Response } from "express";
import User from "../models/User";
import type { AuthRequest } from "./auth";
import { sendError } from "../utils/errors";

export default async function requireVerified(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const user = await User.findById(req.user!._id)
        .select("verified")
        .lean();

    if (!user) {
        sendError(res, 401, "UNAUTHORIZED", "Sessão expirada.");
        return;
    }

    if (!user.verified) {
        sendError(
            res,
            403,
            "EMAIL_NOT_VERIFIED",
            "Confirme seu email para continuar.",
            { needsVerification: true },
        );
        return;
    }

    next();
}
