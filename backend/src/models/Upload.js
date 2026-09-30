import mongoose from "mongoose";

//an uploaded image's bytes, kept in MongoDB instead of on the server's disk so they survive redeploys
//(the Vercel function has no lasting disk). 5 MB max per file is well under Mongo's 16 MB document limit.
const uploadSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, unique: true }, //"/uploads/<folder>/<uuid>.<ext>", as stored on Cafe/Log/User
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Upload", uploadSchema);
