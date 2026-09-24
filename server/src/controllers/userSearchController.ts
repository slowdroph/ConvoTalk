import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as userService from "../services/user";
import { handleError } from "../utils/errors";

export async function searchUsers(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { q, limit } = req.query as unknown as {
            q: string;
            limit: number;
        };
        const result = await userService.searchUsers(q, req.user!._id, limit);
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao buscar usuários.");
    }
}
