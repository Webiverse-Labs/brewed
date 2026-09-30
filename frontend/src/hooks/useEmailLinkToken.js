import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// The emailed links carry their token in the URL fragment (/reset-password#token=…). A fragment is never sent to a
// server, so the token stays out of request logs. Read it once, then drop it from the address bar and history.
export function useEmailLinkToken() {
  const { hash, pathname } = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(hash.slice(1)).get("token"));

  useEffect(() => {
    if (hash) navigate(pathname, { replace: true });
  }, [hash, pathname, navigate]);

  return token;
}
