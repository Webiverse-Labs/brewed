import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import testRoutes from "./routes/testRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cafeRoutes from "./routes/cafeRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import suggestionRoutes from "./routes/suggestionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";
import { serveUpload } from "./middlewares/uploadMiddleware.js";
import { asyncHandler } from "./middlewares/asyncHandlerMiddleware.js";

//The Express app, without listening or connecting to MongoDB. Two entry points use it:
//server.js (local dev, `npm start`) and ../../api/index.js (the Vercel function).

//allow access to env file
dotenv.config();

//every login signs a JWT with this; refuse to start without it rather than failing on the first signup
if (!process.env.JWT_SECRET?.trim()) {
  throw new Error("JWT_SECRET is not set. Add it to backend/.env (see .env.example).");
}

//initializes express
const app = express();

//allow frontend access
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // Required to allow cookies across origins
  }),
);

//allow reading from json
app.use(express.json());
//allow parsing cookies
app.use(cookieParser());

//uploaded images (café photos, log photos, avatars), stored in MongoDB
app.get("/uploads/:folder/:file", asyncHandler(serveUpload));
app.use("/uploads", notFound);

//api routes
app.get("/", (req, res) => {
  res.send("wazzup world");
});
//for uptime checks: 200 only while the database connection is up
app.get("/api/health", (req, res) => {
  const ok = mongoose.connection.readyState === 1;
  res.status(ok ? 200 : 503).json({ ok });
});
app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cafes", cafeRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/suggestions", suggestionRoutes);
app.use("/api/admin", adminRoutes);

//anything unmatched under /api, then the error handler (must stay last)
app.use("/api", notFound);
app.use(errorHandler);

export default app;
