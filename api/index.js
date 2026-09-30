import app from "../backend/src/app.js";
import connectDB from "../backend/src/config/db.js";

//The Vercel function: vercel.json sends every /api/* and /uploads/* request here, and Vercel's CDN serves
//the built frontend, so the app and the API share one origin (the sameSite=lax auth cookie just works).

//Vercel doesn't set NODE_ENV for functions; "production" makes the auth cookie `secure`
process.env.NODE_ENV ??= "production";

export default async function handler(req, res) {
  //a function has no startup step: connect on the first request, and later requests reuse the connection
  try {
    await connectDB();
  } catch (error) {
    console.error("Failed connecting to MongoDB:", error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ message: "The database is unavailable. Please try again in a moment." }));
  }
  return app(req, res);
}
