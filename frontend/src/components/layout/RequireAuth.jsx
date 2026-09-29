import { Navigate, useLocation } from "react-router-dom";
import Loader from "../ui/Loader.jsx";
import { useAuth } from "../../hooks/useAuth.js";

// Route guard. `admin` pages need role "admin"; user pages send admins to their dashboard
// (admins have no public profile, favorites, etc.). After logging in, users return to `from`.
function RequireAuth({ admin = false, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullScreen />;
  if (!user) return <Navigate to={admin ? "/admin/login" : "/login"} replace state={{ from: location }} />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  if (!admin && user.role === "admin") return <Navigate to="/admin" replace />;
  return children;
}

export default RequireAuth;
