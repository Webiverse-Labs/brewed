import mongoose from "mongoose";

//user input -> safe case-insensitive "contains" regex (special characters escaped)
export function containsRegex(query) {
  const escaped = String(query).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "i");
}

export const isObjectId = (value) => mongoose.isValidObjectId(value);

//multipart forms send booleans as strings
export const toBool = (value) => value === true || value === "true";

//"47 Matilde St, Poblacion, Makati City" -> "Poblacion, Makati City" (short location for cards)
export function areaFromAddress(address = "") {
  const parts = String(address)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.slice(-2).join(", ");
}

//"Specialty, Micro-roastery" -> ["Specialty", "Micro-roastery"]
export function parseTags(value) {
  if (Array.isArray(value)) return value.map(String).map((t) => t.trim()).filter(Boolean);
  return String(value ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

//copy only the listed keys that are present in the body (for PATCH endpoints)
export function pick(body = {}, keys) {
  return Object.fromEntries(keys.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));
}
