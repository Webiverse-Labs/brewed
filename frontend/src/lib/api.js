import axios from "axios";

//this is where we access the backendserver
const BASE_URL = "http://localhost:4000/api";
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export default api;
