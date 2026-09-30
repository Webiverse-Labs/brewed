import mongoose from "mongoose";

let connection;

//Connects once and hands every later caller the same promise, so it's safe to call on every request
//(the Vercel function has no startup step) as well as once at startup (server.js, seed.js).
//A failed attempt is forgotten so the next call retries; callers decide what a failure means.
function connectDB() {
  connection ??= mongoose
    //each serverless instance keeps its own pool; 10 keeps many instances well under Atlas Free's 500-connection cap.
    //10 s instead of 30 s to give up on an unreachable cluster (e.g. Atlas Network Access blocking the host)
    .connect(process.env.MONGO_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 10_000 })
    .then(() => console.log("MongoDB connected"))
    .catch((error) => {
      connection = undefined;
      throw error;
    });
  return connection;
}

export default connectDB;
