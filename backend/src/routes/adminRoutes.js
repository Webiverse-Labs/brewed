import express from "express";
import {
  adminLogin,
  createCafe,
  getStats,
  listAllCafes,
  listSuggestions,
  listUsers,
  reviewSuggestion,
  updateAdminMe,
  updateCafe,
  updateUserStatus,
} from "../controllers/adminController.js";
import { requireAdmin } from "../middlewares/adminMiddleware.js";
import { asyncHandler } from "../middlewares/asyncHandlerMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { updateAvatar } from "../controllers/userController.js";
import { cancelEmailChange, requestAdminEmailChange } from "../controllers/emailChangeController.js";
import { changeAdminPassword, signOutOtherAdminSessions } from "../controllers/adminAccountController.js";

const router = express.Router();

router.post("/login", asyncHandler(adminLogin));

//everything below requires a logged-in admin
router.use(protect, requireAdmin);

router.get("/stats", asyncHandler(getStats));

router.get("/cafes", asyncHandler(listAllCafes));
router.post("/cafes", upload("cafes").array("photos", 6), asyncHandler(createCafe));
router.patch("/cafes/:id", upload("cafes").array("photos", 6), asyncHandler(updateCafe));

router.get("/users", asyncHandler(listUsers));
router.patch("/users/:id", asyncHandler(updateUserStatus));

router.get("/suggestions", asyncHandler(listSuggestions));
router.patch("/suggestions/:id", asyncHandler(reviewSuggestion));

router.patch("/me", asyncHandler(updateAdminMe));
router.post("/me/avatar", upload("avatars").single("avatar"), asyncHandler(updateAvatar));
router.patch("/me/email", asyncHandler(requestAdminEmailChange));
router.delete("/me/email", asyncHandler(cancelEmailChange));
router.patch("/me/password", asyncHandler(changeAdminPassword));
router.post("/me/sign-out-others", asyncHandler(signOutOtherAdminSessions));

export default router;
