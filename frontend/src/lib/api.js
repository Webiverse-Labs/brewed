import axios from "axios";

//this is where we access the backendserver (override with VITE_API_URL in frontend/.env.local)
//Production builds default to "" = same origin: on Vercel the app and the API share one domain (vercel.json)
export const API_ORIGIN = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:4000" : "");

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true, //send the auth cookie
});

//the backend always answers errors with { message }
export const errorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  //413 comes from the host, not our API (Vercel refuses requests over 4.5 MB), so it has no { message }
  if (error?.response?.status === 413) return "Those photos are too big to send together. Try fewer or smaller ones.";
  return error?.response?.data?.message ?? fallback;
};

export default api;
