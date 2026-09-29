import mongoose from "mongoose";
import { toJSONPlugin } from "../lib/toJSONPlugin.js";

//"Suggest a Café" submissions, reviewed by admins
const suggestionSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Café name is required."], trim: true, maxlength: 100 },
    address: { type: String, required: [true, "Address is required."], trim: true, maxlength: 200 },
    hours: { type: String, trim: true, maxlength: 120, default: "" },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    photo: { type: String, default: "" },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, //null once the user deletes their account
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedAt: Date,
  },
  { timestamps: true },
);

suggestionSchema.index({ status: 1, createdAt: -1 });

suggestionSchema.plugin(toJSONPlugin);

export default mongoose.model("Suggestion", suggestionSchema);
