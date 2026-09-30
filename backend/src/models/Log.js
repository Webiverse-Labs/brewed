import mongoose from "mongoose";
import { toJSONPlugin } from "../lib/toJSONPlugin.js";

export const ITEM_CATEGORIES = ["Coffee", "Tea", "Pastry", "Food", "Other"];

//one "What did you order?" row
const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, enum: ITEM_CATEGORIES, default: "Coffee" },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    note: { type: String, trim: true, maxlength: 200, default: "" },
  },
  { _id: false },
);

//a café visit: a public "review" or a private "diary" entry
const logSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cafe: { type: mongoose.Schema.Types.ObjectId, ref: "Cafe", required: true },
    type: { type: String, enum: ["review", "diary"], required: true },
    visitedAt: {
      type: Date,
      default: Date.now,
      //allow "today" in any timezone, but not future visits
      validate: [(date) => date.getTime() <= Date.now() + 24 * 60 * 60 * 1000, "Visit date can't be in the future."],
    },
    rating: {
      type: Number,
      required: [true, "Give your visit an overall rating."],
      min: [1, "Rating must be between 1 and 5."],
      max: [5, "Rating must be between 1 and 5."],
    },
    items: [itemSchema],
    text: { type: String, trim: true, maxlength: 2000, default: "" },
    anonymous: { type: Boolean, default: false }, //reviews only
    photos: [String], //diary only, "/uploads/logs/<file>"
  },
  { timestamps: true },
);

logSchema.index({ cafe: 1, type: 1, visitedAt: -1 });
logSchema.index({ user: 1, visitedAt: -1 });

logSchema.plugin(toJSONPlugin);

export default mongoose.model("Log", logSchema);
