import express from "express";
import { addFavorite, getCafe, getCafeLogs, listCafes, removeFavorite } from "../controllers/cafeController.js";
import { asyncHandler } from "../middlewares/asyncHandlerMiddleware.js";
import { optionalAuth, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", asyncHandler(listCafes));
router.get("/:id", optionalAuth, asyncHandler(getCafe));
router.get("/:id/logs", asyncHandler(getCafeLogs));
router.post("/:id/favorite", protect, asyncHandler(addFavorite));
router.delete("/:id/favorite", protect, asyncHandler(removeFavorite));

export default router;
