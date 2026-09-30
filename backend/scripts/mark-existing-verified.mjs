// One-off, safe to re-run: marks every account created before email verification existed as verified, so nobody
// is locked out of posting. New signups always have the field, so they're untouched.
// Usage (from backend/): node --env-file=.env.test scripts/mark-existing-verified.mjs
import mongoose from "mongoose";
import User from "../src/models/User.js";

if (!process.env.MONGO_URI) {
  console.error("Set MONGO_URI (e.g. node --env-file=.env.test scripts/mark-existing-verified.mjs).");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const { matchedCount, modifiedCount } = await User.updateMany(
  { emailVerified: { $exists: false } },
  { $set: { emailVerified: true } },
);
console.log(`Accounts without the field: ${matchedCount}; marked verified: ${modifiedCount}.`);
await mongoose.disconnect();
