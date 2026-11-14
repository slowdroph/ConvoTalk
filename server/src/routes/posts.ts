import { Router } from "express";
import auth from "../middleware/auth";
import { validate } from "../middleware/validate";
import postUpload from "../middleware/postUpload";
import {
    postWriteLimiter,
    postReadLimiter,
    postInteractionLimiter,
} from "../middleware/rateLimiter";
import {
    createPostSchema,
    postsQuerySchema,
    postsByUserQuerySchema,
    savedPostsQuerySchema,
    postParamsSchema,
    trendingTopicsQuerySchema,
    commentsQuerySchema,
    createCommentSchema,
    commentParamsSchema,
} from "../validations";
import {
    listFeed,
    listUserPosts,
    listSavedPosts,
    getPost,
    getPostStats,
    listTrendingTopics,
    createPost,
    deletePost,
    likePost,
    unlikePost,
    savePost,
    unsavePost,
    listComments,
    createComment,
    deleteComment,
} from "../controllers/postController";

const router = Router();

router.get("/", auth, postReadLimiter, validate(postsQuerySchema), listFeed);
router.get(
    "/trending",
    auth,
    postReadLimiter,
    validate(trendingTopicsQuerySchema),
    listTrendingTopics,
);
router.get("/stats/me", auth, postReadLimiter, getPostStats);
router.get(
    "/saved",
    auth,
    postReadLimiter,
    validate(savedPostsQuerySchema),
    listSavedPosts,
);
router.get(
    "/user/:userId",
    auth,
    postReadLimiter,
    validate(postsByUserQuerySchema),
    listUserPosts,
);
router.get(
    "/:id/comments",
    auth,
    postReadLimiter,
    validate(commentsQuerySchema),
    listComments,
);
router.post(
    "/:id/comments",
    auth,
    postInteractionLimiter,
    validate(createCommentSchema),
    createComment,
);
router.delete(
    "/:id/comments/:commentId",
    auth,
    postInteractionLimiter,
    validate(commentParamsSchema),
    deleteComment,
);
router.get(
    "/:id",
    auth,
    postReadLimiter,
    validate(postParamsSchema),
    getPost,
);
router.post(
    "/",
    auth,
    postWriteLimiter,
    postUpload.single("image"),
    validate(createPostSchema),
    createPost,
);
router.delete(
    "/:id",
    auth,
    postWriteLimiter,
    validate(postParamsSchema),
    deletePost,
);
router.post(
    "/:id/like",
    auth,
    postInteractionLimiter,
    validate(postParamsSchema),
    likePost,
);
router.delete(
    "/:id/like",
    auth,
    postInteractionLimiter,
    validate(postParamsSchema),
    unlikePost,
);
router.post(
    "/:id/save",
    auth,
    postInteractionLimiter,
    validate(postParamsSchema),
    savePost,
);
router.delete(
    "/:id/save",
    auth,
    postInteractionLimiter,
    validate(postParamsSchema),
    unsavePost,
);

export default router;
