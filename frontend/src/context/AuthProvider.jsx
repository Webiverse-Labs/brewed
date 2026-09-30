import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api, { errorMessage } from "../lib/api.js";
import { AuthContext } from "./authContext.js";

// Holds the logged-in user (from the `token` cookie). `user` is undefined while the first /auth/me check runs,
// null when logged out, and includes `favorites` and `unreadNotifications`.
function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  //initial check on load (same as refresh, but ignores the answer if the app unmounts first)
  useEffect(() => {
    let cancelled = false;
    api
      .get("/auth/me")
      .then(({ data }) => !cancelled && setUser(data.user))
      .catch(() => !cancelled && setUser(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading: user === undefined,
      refresh,
      //merge fields after a mutation, e.g. updateUser({ favorites }) or updateUser({ unreadNotifications: 0 })
      updateUser: (patch) => setUser((current) => (current ? { ...current, ...patch } : current)),
      setUser,
      login: async (email, password, { admin = false } = {}) => {
        const { data } = await api.post(admin ? "/admin/login" : "/auth/login", { email, password });
        setUser(data.user);
        return data.user;
      },
      signup: async (fields) => {
        const { data } = await api.post("/auth/signup", fields);
        setUser(data.user);
        return data.user;
      },
      //credential = the ID token from the Google button; resolves to { user, isNew }
      loginWithGoogle: async (credential) => {
        const { data } = await api.post("/auth/google", { credential });
        setUser(data.user);
        return data;
      },
      //only the server can clear the httpOnly cookie, so stay logged in if it didn't answer.
      //Resolves to false (after telling the user) so callers know not to navigate away.
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch (err) {
          toast.error(errorMessage(err, "Couldn't log out. Check your connection and try again."));
          return false;
        }
        setUser(null);
        return true;
      },
    }),
    [user, refresh],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export default AuthProvider;
