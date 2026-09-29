import axios from "axios";

//this is where we access the backendserver (override with VITE_API_URL in frontend/.env.local)
export const API_ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true, //send the auth cookie
});

//the backend always answers errors with { message }
export const errorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.response?.data?.message ?? fallback;

export default api;
