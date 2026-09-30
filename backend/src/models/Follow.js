import mongoose from "mongoose";
import { toJSONPlugin } from "../lib/toJSONPlugin.js";

//follower -> following ("Follow" / "Following" buttons)
const followSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

//one row per pair, so following twice is a no-op
followSchema.index({ follower: 1, following: 1 }, { unique: true });

followSchema.plugin(toJSONPlugin);

export default mongoose.model("Follow", followSchema);
