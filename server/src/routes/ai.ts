import { Router } from "express";
import auth from "../middleware/auth";
import { aiLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { aiSuggestRepliesSchema, aiSummarizeSchema } from "../validations";
import { suggestReplies, summarizeRoom } from "../controllers/aiController";

const router = Router();

router.use(auth);
router.use(aiLimiter);

router.post(
    "/rooms/:roomId/summarize",
    validate(aiSummarizeSchema),
    summarizeRoom,
);
router.post(
    "/rooms/:roomId/suggest-replies",
    validate(aiSuggestRepliesSchema),
    suggestReplies,
);

export default router;
