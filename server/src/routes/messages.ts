import { Router } from "express";
import auth from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
    messagesQuerySchema,
    messageSearchQuerySchema,
    searchQuerySchema,
} from "../validations";
import {
    messageUpload,
    searchMessages,
    searchRoomMessages,
    exportRoom,
    uploadAttachments,
    getRoomMessages,
    getThreadMessages,
} from "../controllers/messageController";

const router = Router();

router.get("/search", auth, validate(searchQuerySchema), searchMessages);
router.get(
    "/:roomId/search",
    auth,
    validate(messageSearchQuerySchema),
    searchRoomMessages,
);
router.get("/:roomId/export", auth, exportRoom);
router.get("/:roomId/thread/:messageId", auth, getThreadMessages);
router.post(
    "/:roomId/attachments",
    auth,
    messageUpload.array("files", 5),
    uploadAttachments,
);
router.get("/:roomId", auth, validate(messagesQuerySchema), getRoomMessages);

export default router;
