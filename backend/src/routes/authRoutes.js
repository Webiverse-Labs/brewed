import express from "express";
import {
  forgotPassword,
  login,
  logout,
  me,
  resendVerification,
  resetPassword,
  signup,
  verifyEmail,
} from "../controllers/authController.js";
import { asyncHandler } from "../middlewares/asyncHandlerMiddleware.js";
import { optionalAuth, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/signup", asyncHandler(signup));
router.post("/login", asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.post("/verify-email", asyncHandler(verifyEmail));
router.post("/resend-verification", protect, asyncHandler(resendVerification));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));
router.get("/me", optionalAuth, asyncHandler(me));

export default router;
