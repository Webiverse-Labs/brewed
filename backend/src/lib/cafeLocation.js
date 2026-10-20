import { ApiError } from "./ApiError.js";

// Both admin JSON requests and multipart forms use latitude / longitude.
// Omission preserves an existing pin; two blank values explicitly remove it.
export function parseCafeLocation(body) {
  const { latitude, longitude } = body;
  if (latitude === undefined && longitude === undefined) return undefined;
  const blank = (value) => value === null || (typeof value === "string" && value.trim() === "");
  if (blank(latitude) && blank(longitude)) return null;
  const coordinate = (value, max) => {
    if (!["string", "number"].includes(typeof value) || blank(value)) return null;
    const number = Number(value);
    return Number.isFinite(number) && Math.abs(number) <= max ? number : null;
  };
  const lat = coordinate(latitude, 90);
  const lng = coordinate(longitude, 180);
  if (lat === null || lng === null) throw new ApiError(400, "Enter a valid latitude (-90 to 90) and longitude (-180 to 180).");
  return { lat, lng };
}
