// Adds the researched map locations to existing cafés only. Never creates cafés or replaces saved pins.
// Preview: node scripts/pin-cafes.mjs     Apply: node scripts/pin-cafes.mjs --apply
import { readFile } from "node:fs/promises";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Cafe from "../src/models/Cafe.js";
import { parseCafeLocation } from "../src/lib/cafeLocation.js";

dotenv.config({ path: new URL("../.env", import.meta.url), quiet: true });
const apply = process.argv.includes("--apply");
const data = JSON.parse(await readFile(new URL("../data/cafe-map-locations.json", import.meta.url), "utf8"));
try {
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false, serverSelectionTimeoutMS: 10000 });
  let count = 0;
  for (const entry of data.cafes) {
    const place = data.places[entry.place];
    const location = parseCafeLocation({ latitude: place.lat, longitude: place.lng });
    const filter = { name: entry.name, address: entry.address, location: null };
    const cafe = await Cafe.findOne(filter).select("_id").lean();
    if (!cafe) continue;
    if (apply) {
      const result = await Cafe.updateOne({ ...filter, _id: cafe._id }, { $set: { location } }, { runValidators: true });
      if (!result.modifiedCount) continue;
    }
    count++;
    console.log(`${apply ? "Pinned" : "Would pin"}: ${entry.name} (${location.lat}, ${location.lng})`);
  }
  console.log(`${count} café locations ${apply ? "saved" : "ready; run with --apply to save"}. Existing pins are preserved.`);
} catch (error) {
  console.error("Café location sync failed:", error.code ?? error.name);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
