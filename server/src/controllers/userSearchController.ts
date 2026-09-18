import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as userService from "../services/user";
import { handleError } from "../utils/errors";

export async function searchUsers(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { q } = req.query as { q: string };
        const result = await userService.searchUsers(q, req.user!._id);
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao buscar usuários.");
    }
}
