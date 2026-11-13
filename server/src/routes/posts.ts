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
    postParamsSchema,
    trendingTopicsQuerySchema,
} from "../validations";
import {
    listFeed,
    listUserPosts,
    getPost,
    getPostStats,
    listTrendingTopics,
    createPost,
    deletePost,
    likePost,
    unlikePost,
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
    "/user/:userId",
    auth,
    postReadLimiter,
    validate(postsByUserQuerySchema),
    listUserPosts,
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

export default router;
