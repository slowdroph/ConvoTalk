import { Response } from "express";
import * as postService from "../services/post";
import { AuthRequest } from "../middleware/auth";
import { handleError } from "../utils/errors";

type PostPaginationQuery = {
    limit: number;
    before?: string;
    beforeId?: string;
};

type PostFeedQuery = PostPaginationQuery & {
    filter?: "all" | "media" | "mine";
    sort?: "recent" | "popular";
    beforeLikes?: number;
};

export async function listFeed(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { limit, filter, sort, before, beforeLikes, beforeId } =
            req.query as unknown as PostFeedQuery;

        const result = await postService.getFeed(req.user!._id, {
            limit,
            filter,
            sort,
            before,
            beforeLikes,
            beforeId,
        });
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao carregar o feed.");
    }
}

export async function getPostStats(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const result = await postService.getPostStats(req.user!._id);
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao carregar as estatísticas.");
    }
}

export async function listTrendingTopics(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { limit } = req.query as unknown as { limit: number };
        const result = await postService.getTrendingTopics(
            req.user!._id,
            limit,
        );
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao carregar os tópicos em alta.");
    }
}

export async function listUserPosts(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { userId } = req.params as { userId: string };
        const { limit, before, beforeId } =
            req.query as unknown as PostPaginationQuery;

        const result = await postService.getUserPosts(
            req.user!._id,
            userId,
            { limit, before, beforeId },
        );
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao carregar os posts do usuário.");
    }
}

export async function getPost(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { id } = req.params as { id: string };
        const post = await postService.getPost(req.user!._id, id);
        res.json(post);
    } catch (error) {
        handleError(error, res, "Erro ao carregar o post.");
    }
}

export async function createPost(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { content, clientPostId } = req.body as {
            content: string;
            clientPostId?: string;
        };

        const post = await postService.createPost(
            req.user!._id,
            { content, clientPostId },
            req.file,
        );
        res.status(201).json(post);
    } catch (error) {
        handleError(error, res, "Erro ao publicar o post.");
    }
}

export async function deletePost(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { id } = req.params as { id: string };
        await postService.deletePost(req.user!._id, id);
        res.status(204).send();
    } catch (error) {
        handleError(error, res, "Erro ao excluir o post.");
    }
}

export async function likePost(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { id } = req.params as { id: string };
        const result = await postService.setPostLike(req.user!._id, id, true);
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao curtir o post.");
    }
}

export async function unlikePost(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { id } = req.params as { id: string };
        const result = await postService.setPostLike(req.user!._id, id, false);
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao descurtir o post.");
    }
}
