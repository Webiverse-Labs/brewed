import express from "express";
import { createLog } from "../controllers/logController.js";
import { asyncHandler } from "../middlewares/asyncHandlerMiddleware.js";
import { protect, requireVerified } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/", protect, requireVerified, upload("logs").array("photos", 6), asyncHandler(createLog));

export default router;
