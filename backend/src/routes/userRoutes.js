import express from "express";
import {
  changePassword,
  deleteMe,
  follow,
  getFavorites,
  getProfile,
  getUserLogs,
  getVisited,
  searchUsers,
  unfollow,
  updateAvatar,
  updateMe,
} from "../controllers/userController.js";
import { asyncHandler } from "../middlewares/asyncHandlerMiddleware.js";
import { optionalAuth, protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

//"/me" routes come before "/:username" so "me" isn't treated as a username
router.patch("/me", protect, asyncHandler(updateMe));
router.post("/me/avatar", protect, upload("avatars").single("avatar"), asyncHandler(updateAvatar));
router.patch("/me/password", protect, asyncHandler(changePassword));
router.delete("/me", protect, asyncHandler(deleteMe));

router.get("/", optionalAuth, asyncHandler(searchUsers));
router.get("/:username", optionalAuth, asyncHandler(getProfile));
router.get("/:username/visited", optionalAuth, asyncHandler(getVisited));
router.get("/:username/favorites", optionalAuth, asyncHandler(getFavorites));
router.get("/:username/logs", optionalAuth, asyncHandler(getUserLogs));

router.post("/:id/follow", protect, asyncHandler(follow));
router.delete("/:id/follow", protect, asyncHandler(unfollow));

export default router;
