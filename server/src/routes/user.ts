import { Router } from "express";
import auth from "../middleware/auth";
import { validate } from "../middleware/validate";
import upload from "../middleware/upload";
import { profileEmailGuardLimiter, emailChangeLimiter } from "../middleware/rateLimiter";
import {
    objectId,
    profileSchema,
    locationSchema,
    passwordSchema,
    accountSchema,
    blockUserParams,
    statusSchema,
    confirmEmailChangeSchema,
} from "../validations";
import {
    getMe,
    getUserStatus,
    getUserProfile,
    updateProfile,
    updateLocation,
    updateStatus,
    updatePassword,
    deleteAccount,
    updateAvatar,
    removeAvatar,
    blockUser,
    unblockUser,
    listBlockedUsers,
    confirmEmailChange,
} from "../controllers/userController";

const router = Router();

router.get("/me", auth, getMe);
router.get("/:id/status", auth, getUserStatus);
router.get("/:id/profile", auth, getUserProfile);
router.put(
    "/profile",
    auth,
    profileEmailGuardLimiter,
    validate(profileSchema),
    updateProfile,
);
router.put(
    "/location",
    auth,
    validate(locationSchema),
    updateLocation,
);
router.post(
    "/confirm-email-change",
    emailChangeLimiter,
    validate(confirmEmailChangeSchema),
    confirmEmailChange,
);
router.put("/status", auth, validate(statusSchema), updateStatus);
router.put("/password", auth, validate(passwordSchema), updatePassword);
router.delete("/account", auth, validate(accountSchema), deleteAccount);
router.put("/avatar", auth, upload.single("avatar"), updateAvatar);
router.delete("/avatar", auth, removeAvatar);
router.get("/blocked", auth, listBlockedUsers);
router.post("/:id/block", auth, validate(blockUserParams), blockUser);
router.delete("/:id/block", auth, validate(blockUserParams), unblockUser);

export default router;
