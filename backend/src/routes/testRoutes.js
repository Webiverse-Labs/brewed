import express from "express";
import { getTest } from "../controllers/testController.js";
import { asyncHandler } from "../middlewares/asyncHandlerMiddleware.js";

const router = express.Router();

router.get("/", asyncHandler(getTest));

export default router;
