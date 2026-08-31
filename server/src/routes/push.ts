import { Router } from "express";
import auth from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
    pushSubscribeSchema,
    pushUnsubscribeSchema,
} from "../validations";
import {
    getVapidPublicKeyHandler,
    subscribe,
    unsubscribe,
} from "../controllers/pushController";

const router = Router();

router.get("/vapid-public-key", auth, getVapidPublicKeyHandler);
router.post("/subscribe", auth, validate(pushSubscribeSchema), subscribe);
router.post("/unsubscribe", auth, validate(pushUnsubscribeSchema), unsubscribe);

export default router;
