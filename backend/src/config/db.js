import mongoose from "mongoose";

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.log("Failed connecting to MongoDB:", error);
    process.exit(1); //1 means exit with failure
  }
}

export default connectDB;
