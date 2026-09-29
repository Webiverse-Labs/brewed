import mongoose from "mongoose";
import { toJSONPlugin } from "../lib/toJSONPlugin.js";

const cafeSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Café name is required."], trim: true, maxlength: 100 },
    area: { type: String, trim: true, default: "" }, //short location for cards, e.g. "Poblacion, Makati"
    address: { type: String, required: [true, "Address is required."], trim: true, maxlength: 200 },
    hours: { type: String, trim: true, maxlength: 120, default: "" },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    tags: [{ type: String, trim: true }],
    photos: [String], //"/uploads/cafes/<file>" paths
    active: { type: Boolean, default: true }, //admin "Disable" hides the café from users
    featured: { type: Boolean, default: false },
    //denormalized from Logs by lib/cafeStats.js — never set these directly
    rating: { type: Number, default: 0 },
    visits: { type: Number, default: 0 },
  },
  { timestamps: true },
);

//cover image used by cards (the frontend's `cafe.photo`)
cafeSchema.virtual("photo").get(function () {
  return this.photos?.[0] ?? null;
});

cafeSchema.index({ active: 1, visits: -1 });

cafeSchema.plugin(toJSONPlugin);

export default mongoose.model("Cafe", cafeSchema);
