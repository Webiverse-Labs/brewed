import { createContext } from "react";

// { user, loading, login, signup, logout, refresh, updateUser } — provided by AuthProvider, read with useAuth()
export const AuthContext = createContext(null);
