import { Router } from "express";
import auth from "../middleware/auth";
import { validate } from "../middleware/validate";
import upload from "../middleware/upload";
import { objectId, profileSchema, passwordSchema, accountSchema, blockUserParams, statusSchema } from "../validations";
import {
  getMe,
  getUserStatus,
  updateProfile,
  updateStatus,
  updatePassword,
  deleteAccount,
  updateAvatar,
  removeAvatar,
  blockUser,
  unblockUser,
  listBlockedUsers,
} from "../controllers/userController";

const router = Router();

router.get("/me", auth, getMe);
router.get("/:id/status", auth, getUserStatus);
router.put("/profile", auth, validate(profileSchema), updateProfile);
router.put("/status", auth, validate(statusSchema), updateStatus);
router.put("/password", auth, validate(passwordSchema), updatePassword);
router.delete("/account", auth, validate(accountSchema), deleteAccount);
router.put("/avatar", auth, upload.single("avatar"), updateAvatar);
router.delete("/avatar", auth, removeAvatar);
router.get("/blocked", auth, listBlockedUsers);
router.post("/:id/block", auth, validate(blockUserParams), blockUser);
router.delete("/:id/block", auth, validate(blockUserParams), unblockUser);

export default router;
