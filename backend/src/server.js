import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import testRoutes from "./routes/testRoutes.js";

//allow access to env file
dotenv.config();

//initializes express
const app = express();

//allow frontend access
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // Required to allow cookies across origins
  }),
);

//allow reading from json
app.use(express.json());
//allow parsing cookies
app.use(cookieParser());

const PORT = process.env.PORT;

//api routes
app.get("/", (req, res) => {
  res.send("wazzup world");
});
app.use("/api/test", testRoutes);

//connect to MongoDB first before server connection
connectDB().then(() =>
  app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
  }),
);
