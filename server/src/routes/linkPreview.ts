import { Router } from "express";
import auth from "../middleware/auth";
import { validate } from "../middleware/validate";
import { linkPreviewSchema } from "../validations";
import { previewLink } from "../controllers/linkPreviewController";

const router = Router();

router.post("/preview", auth, validate(linkPreviewSchema), previewLink);

export default router;
