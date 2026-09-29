import express from "express";
import { listNotifications, markAllRead, markRead } from "../controllers/notificationController.js";
import { asyncHandler } from "../middlewares/asyncHandlerMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", asyncHandler(listNotifications));
router.patch("/read-all", asyncHandler(markAllRead));
router.patch("/:id/read", asyncHandler(markRead));

export default router;
