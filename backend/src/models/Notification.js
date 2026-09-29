import mongoose from "mongoose";
import { toJSONPlugin } from "../lib/toJSONPlugin.js";

export const NOTIFICATION_TYPES = ["follow", "cafe_update", "system"];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, //recipient
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, //who followed, for "follow"
    cafe: { type: mongoose.Schema.Types.ObjectId, ref: "Cafe" }, //for "cafe_update"
    message: { type: String, required: true, maxlength: 300 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, createdAt: -1 });

notificationSchema.plugin(toJSONPlugin);

export default mongoose.model("Notification", notificationSchema);
