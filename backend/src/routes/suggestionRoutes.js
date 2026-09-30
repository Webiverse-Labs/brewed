import express from "express";
import { createSuggestion } from "../controllers/suggestionController.js";
import { asyncHandler } from "../middlewares/asyncHandlerMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

//admins list and review suggestions under /api/admin/suggestions
router.post("/", protect, upload("suggestions").single("photo"), asyncHandler(createSuggestion));

export default router;
