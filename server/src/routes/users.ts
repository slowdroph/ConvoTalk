import { Router } from "express";
import auth from "../middleware/auth";
import { validate } from "../middleware/validate";
import { searchUserLimiter } from "../middleware/rateLimiter";
import { userSearchQuerySchema } from "../validations";
import { searchUsers } from "../controllers/userSearchController";

const router = Router();

router.get(
    "/search",
    auth,
    searchUserLimiter,
    validate(userSearchQuerySchema),
    searchUsers,
);

export default router;
