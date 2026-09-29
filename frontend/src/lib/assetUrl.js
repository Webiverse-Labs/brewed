import { API_ORIGIN } from "./api.js";

//the API stores uploads as "/uploads/..." paths served by the backend; anything else passes through
export const assetUrl = (path) => {
  if (!path) return null;
  return path.startsWith("/uploads/") ? `${API_ORIGIN}${path}` : path;
};
