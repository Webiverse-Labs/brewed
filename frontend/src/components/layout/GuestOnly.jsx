import { Navigate } from "react-router-dom";
import Loader from "../ui/Loader.jsx";
import { useAuth } from "../../hooks/useAuth.js";

// Wraps the sign-up / log-in pages: someone already logged in goes straight to their home.
function GuestOnly({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullScreen />;
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
  return children;
}

export default GuestOnly;
