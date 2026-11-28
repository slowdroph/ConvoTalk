import { Router } from "express";
import auth from "../middleware/auth";
import requireVerified from "../middleware/requireVerified";
import { validate } from "../middleware/validate";
import upload from "../middleware/upload";
import { profileEmailGuardLimiter, emailChangeLimiter, profileUpdateLimiter } from "../middleware/rateLimiter";
import {
    objectId,
    profileSchema,
    locationSchema,
    passwordSchema,
    accountSchema,
    blockUserParams,
    statusSchema,
    aboutSchema,
    confirmEmailChangeSchema,
    preferencesSchema,
} from "../validations";
import {
    getMe,
    getUserStatus,
    getUserProfile,
    updateProfile,
    updateLocation,
    updateStatus,
    updateAbout,
    updatePassword,
    deleteAccount,
    updateAvatar,
    removeAvatar,
    blockUser,
    unblockUser,
    listBlockedUsers,
    confirmEmailChange,
    updatePreferences,
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
    requireVerified,
    validate(locationSchema),
    updateLocation,
);
router.post(
    "/confirm-email-change",
    emailChangeLimiter,
    validate(confirmEmailChangeSchema),
    confirmEmailChange,
);
router.put("/status", auth, requireVerified, validate(statusSchema), updateStatus);
router.put(
    "/preferences",
    auth,
    profileUpdateLimiter,
    validate(preferencesSchema),
    updatePreferences,
);
router.put(
    "/about",
    auth,
    requireVerified,
    profileUpdateLimiter,
    validate(aboutSchema),
    updateAbout,
);
router.put("/password", auth, validate(passwordSchema), updatePassword);
router.delete("/account", auth, validate(accountSchema), deleteAccount);
router.put("/avatar", auth, requireVerified, upload.single("avatar"), updateAvatar);
router.delete("/avatar", auth, requireVerified, removeAvatar);
router.get("/blocked", auth, listBlockedUsers);
router.post("/:id/block", auth, validate(blockUserParams), blockUser);
router.delete("/:id/block", auth, validate(blockUserParams), unblockUser);

export default router;
