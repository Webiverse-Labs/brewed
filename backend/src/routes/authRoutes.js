import express from "express";
import { login, logout, me, signup } from "../controllers/authController.js";
import { asyncHandler } from "../middlewares/asyncHandlerMiddleware.js";
import { optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/signup", asyncHandler(signup));
router.post("/login", asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.get("/me", optionalAuth, asyncHandler(me));

export default router;
