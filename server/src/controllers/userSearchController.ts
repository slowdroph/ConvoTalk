import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as userService from "../services/user";
import * as discoverService from "../services/discover";
import type { DiscoverQueryInput } from "../services/discover";
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

export async function getSuggestions(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { limit } = req.query as unknown as { limit: number };
        const users = await userService.getSuggestedUsers(req.user!._id, limit);
        res.json(users);
    } catch (error) {
        handleError(error, res, "Erro ao carregar sugestões.");
    }
}

export async function discoverUsers(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const query = req.query as unknown as DiscoverQueryInput;
        const result = await discoverService.discoverUsers(
            req.user!._id,
            query,
        );
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao descobrir usuários.");
    }
}
