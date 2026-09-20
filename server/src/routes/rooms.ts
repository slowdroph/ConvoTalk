import { Router } from "express";
import auth from "../middleware/auth";
import { validate } from "../middleware/validate";
import upload from "../middleware/upload";
import {
    directRoomSchema,
    createGroupRoomSchema,
    updateGroupRoomSchema,
    patchVisibilitySchema,
    publicRoomsQuerySchema,
    addMemberSchema,
    removeMemberParams,
    addAdminSchema,
    removeAdminParams,
    deleteRoomParams,
} from "../validations";
import {
    listRooms,
    listPublicRooms,
    joinPublicRoom,
    leaveGroupRoom,
    createDirectRoom,
    createGroupRoom,
    updateGroupRoom,
    updateGroupVisibility,
    addMember,
    removeMember,
    deleteRoom,
    addAdmin,
    removeAdmin,
    updateGroupAvatar,
    removeGroupAvatar,
    getPinnedMessages,
} from "../controllers/roomController";

const router = Router();

router.get("/", auth, listRooms);
router.get("/public", auth, validate(publicRoomsQuerySchema), listPublicRooms);
router.get("/:id/pinned", auth, getPinnedMessages);
router.post("/direct", auth, validate(directRoomSchema), createDirectRoom);
router.post("/group", auth, validate(createGroupRoomSchema), createGroupRoom);
router.put("/:id", auth, validate(updateGroupRoomSchema), updateGroupRoom);
router.patch(
    "/:id/visibility",
    auth,
    validate(patchVisibilitySchema),
    updateGroupVisibility,
);
router.post("/:id/join", auth, validate(deleteRoomParams), joinPublicRoom);
router.post("/:id/leave", auth, validate(deleteRoomParams), leaveGroupRoom);
router.post("/:id/members", auth, validate(addMemberSchema), addMember);
router.delete(
    "/:id/members/:userId",
    auth,
    validate(removeMemberParams),
    removeMember,
);
router.delete("/:id", auth, validate(deleteRoomParams), deleteRoom);
router.post("/:id/admins", auth, validate(addAdminSchema), addAdmin);
router.delete(
    "/:id/admins/:userId",
    auth,
    validate(removeAdminParams),
    removeAdmin,
);
router.put("/:id/avatar", auth, upload.single("avatar"), updateGroupAvatar);
router.delete(
    "/:id/avatar",
    auth,
    validate(deleteRoomParams),
    removeGroupAvatar,
);

export default router;
