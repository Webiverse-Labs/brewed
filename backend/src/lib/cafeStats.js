import mongoose from "mongoose";
import Cafe from "../models/Cafe.js";
import Log from "../models/Log.js";

//recompute a café's average rating and visit count from its logs
//(call after any log for that café is created or deleted)
export async function refreshCafeStats(cafeId) {
  const [stats] = await Log.aggregate([
    { $match: { cafe: new mongoose.Types.ObjectId(String(cafeId)) } },
    { $group: { _id: null, rating: { $avg: "$rating" }, visits: { $sum: 1 } } },
  ]);

  await Cafe.updateOne(
    { _id: cafeId },
    { rating: stats ? Math.round(stats.rating * 10) / 10 : 0, visits: stats?.visits ?? 0 },
  );
}

//{ 5: n, 4: n, 3: n, 2: n, 1: n } for the café page's rating breakdown
export async function ratingCounts(cafeId) {
  const rows = await Log.aggregate([
    { $match: { cafe: new mongoose.Types.ObjectId(String(cafeId)) } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const row of rows) counts[row._id] = row.count;
  return counts;
}
