import mongoose from "mongoose";
import dns from "node:dns";

let connection;

//Connects once and hands every later caller the same promise, so it's safe to call on every request
//(the Vercel function has no startup step) as well as once at startup (server.js, seed.js).
//A failed attempt is forgotten so the next call retries; callers decide what a failure means.
function connectDB() {
  connection ??= (async () => {
    try {
      return await mongoose.connect(process.env.MONGO_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10_000,
      });
    } catch (error) {
      // On Windows / some local network routers, SRV queries fail with ECONNREFUSED; fall back to public DNS
      if (error?.code === "ECONNREFUSED" && error?.syscall === "querySrv") {
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
        return await mongoose.connect(process.env.MONGO_URI, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 10_000,
        });
      }
      throw error;
    }
  })()
    .then((conn) => {
      console.log("MongoDB connected");
      return conn;
    })
    .catch((error) => {
      connection = undefined;
      throw error;
    });

  return connection;
}

export default connectDB;
