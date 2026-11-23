import { Router } from "express";
import auth from "../middleware/auth";
import { validate } from "../middleware/validate";
import { searchUserLimiter } from "../middleware/rateLimiter";
import {
    userSearchQuerySchema,
    userSuggestionsQuerySchema,
    discoverQuerySchema,
} from "../validations";
import {
    searchUsers,
    getSuggestions,
    discoverUsers,
} from "../controllers/userSearchController";

const router = Router();

router.get(
    "/suggestions",
    auth,
    searchUserLimiter,
    validate(userSuggestionsQuerySchema),
    getSuggestions,
);

router.get(
    "/search",
    auth,
    searchUserLimiter,
    validate(userSearchQuerySchema),
    searchUsers,
);

router.get(
    "/discover",
    auth,
    searchUserLimiter,
    validate(discoverQuerySchema),
    discoverUsers,
);

export default router;
