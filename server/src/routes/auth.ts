import { Router } from "express";
import { validate } from "../middleware/validate";
import { resetLimiter } from "../middleware/rateLimiter";
import { registerSchema, loginSchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema } from "../validations";
import {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/verify/:token", verifyEmail);
router.post("/resend-verification", validate(resendVerificationSchema), resendVerification);
router.post("/forgot-password", resetLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", resetLimiter, validate(resetPasswordSchema), resetPassword);

export default router;
