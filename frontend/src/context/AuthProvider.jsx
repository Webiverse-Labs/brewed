import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../lib/api.js";
import { AuthContext } from "./authContext.js";
import { useConfirmation } from "../hooks/useConfirmation.js";

// Holds the logged-in user (from the `token` cookie). `user` is undefined while the first /auth/me check runs,
// null when logged out, and includes `favorites` and `unreadNotifications`.
function AuthProvider({ children }) {
  const confirm = useConfirmation();
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
      loginWithGoogle: async (credential, { acceptedPolicies = false } = {}) => {
        const { data } = await api.post("/auth/google", { credential, acceptedPolicies });
        setUser(data.user);
        return data;
      },
      //All user/admin logout entry points share one confirmation. Failures stay in the dialog.
      logout: () => confirm({
        title: "Log out of Brewed?",
        description: "You will need to sign in again to access your account.",
        confirmLabel: "Log Out",
        pendingLabel: "Logging out…",
        onConfirm: async () => {
          await api.post("/auth/logout");
          setUser(null);
        },
      }),
    }),
    [user, refresh, confirm],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export default AuthProvider;
