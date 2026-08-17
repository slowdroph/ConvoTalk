import { Router } from "express";
import auth from "../middleware/auth";
import { validate } from "../middleware/validate";
import { searchQuerySchema } from "../validations";
import { searchUsers } from "../controllers/usersController";

const router = Router();

router.get("/search", auth, validate(searchQuerySchema), searchUsers);

export default router;
