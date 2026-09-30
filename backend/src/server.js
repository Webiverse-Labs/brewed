import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import testRoutes from "./routes/testRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cafeRoutes from "./routes/cafeRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import suggestionRoutes from "./routes/suggestionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";
import { UPLOAD_ROOT, setUploadHeaders } from "./middlewares/uploadMiddleware.js";

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

//uploaded images (café photos, log photos, avatars)
app.use("/uploads", express.static(UPLOAD_ROOT, { setHeaders: setUploadHeaders }));

const PORT = process.env.PORT;

//api routes
app.get("/", (req, res) => {
  res.send("wazzup world");
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

//connect to MongoDB first before server connection
//(Express 5 passes listen errors such as "port already in use" to this callback)
connectDB().then(() =>
  app.listen(PORT, (error) => {
    if (error) {
      console.error(`Could not start on PORT ${PORT}: ${error.message}`);
      process.exit(1);
    }
    console.log(`Server running on PORT: ${PORT}`);
  }),
);
