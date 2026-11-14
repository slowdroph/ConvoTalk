import { Response } from "express";
import * as postService from "../services/post";
import * as commentService from "../services/comment";
import * as savedPostService from "../services/savedPost";
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

type PostSearchQuery = PostFeedQuery & {
    q: string;
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

export async function searchPosts(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { q, limit, filter, sort, before, beforeLikes, beforeId } =
            req.query as unknown as PostSearchQuery;

        const result = await postService.searchPosts(req.user!._id, {
            q,
            limit,
            filter,
            sort,
            before,
            beforeLikes,
            beforeId,
        });
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao buscar posts.");
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

export async function listSavedPosts(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { limit, before, beforeId } =
            req.query as unknown as PostPaginationQuery;

        const result = await savedPostService.listSavedPosts(req.user!._id, {
            limit,
            before,
            beforeId,
        });
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao carregar os posts salvos.");
    }
}

export async function savePost(
    req: AuthRequest,
    res: Response,
): Promise<void> {    try {
        const { id } = req.params as { id: string };
        const result = await savedPostService.savePost(req.user!._id, id);
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao salvar o post.");
    }
}

export async function unsavePost(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { id } = req.params as { id: string };
        const result = await savedPostService.unsavePost(req.user!._id, id);
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao remover o post dos salvos.");
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
        const { content, clientPostId, poll } = req.body as {
            content: string;
            clientPostId?: string;
            poll?: { options: string[] };
        };

        const post = await postService.createPost(
            req.user!._id,
            { content, clientPostId, poll },
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

export async function votePoll(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { id } = req.params as { id: string };
        const { optionId } = req.body as { optionId: string };
        const result = await postService.setPollVote(
            req.user!._id,
            id,
            optionId,
        );
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao registrar o voto.");
    }
}

export async function unvotePoll(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { id } = req.params as { id: string };
        const result = await postService.setPollVote(req.user!._id, id, null);
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao remover o voto.");
    }
}

type CommentQuery = {
    limit: number;
    before?: string;
    beforeId?: string;
};

export async function listComments(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { id } = req.params as { id: string };
        const { limit, before, beforeId } =
            req.query as unknown as CommentQuery;

        const result = await commentService.listComments(req.user!._id, id, {
            limit,
            before,
            beforeId,
        });
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao carregar os comentários.");
    }
}

export async function createComment(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { id } = req.params as { id: string };
        const { content, clientCommentId } = req.body as {
            content: string;
            clientCommentId?: string;
        };

        const result = await commentService.createComment(
            req.user!._id,
            id,
            { content, clientCommentId },
        );
        res.status(201).json(result);
    } catch (error) {
        handleError(error, res, "Erro ao comentar no post.");
    }
}

export async function deleteComment(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { id, commentId } = req.params as {
            id: string;
            commentId: string;
        };

        const result = await commentService.deleteComment(
            req.user!._id,
            id,
            commentId,
        );
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao excluir o comentário.");
    }
}
