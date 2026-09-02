import { Router } from "express";
import { z } from "zod";
import auth from "../middleware/auth";
import { validate } from "../middleware/validate";
import { objectId } from "../validations";
import {
    getSessions,
    deleteSession,
    deleteAllSessions,
} from "../controllers/sessionController";

const router = Router();

const sessionParamsSchema = z.object({
    params: z.object({
        sessionId: objectId,
    }),
});

router.get("/", auth, getSessions);

router.delete(
    "/:sessionId",
    auth,
    validate(sessionParamsSchema),
    deleteSession,
);

router.delete("/", auth, deleteAllSessions);

export default router;
