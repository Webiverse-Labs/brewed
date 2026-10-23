import { useRef, useState } from "react";
import Button from "../../components/ui/Button.jsx";
import SectionLabel from "../../components/ui/SectionLabel.jsx";
import api, { errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useEmailLinkToken } from "../../hooks/useEmailLinkToken.js";

function ChangeEmailPage() {
  const token = useEmailLinkToken();
  const { user, setUser } = useAuth();
  const [adminLogin, setAdminLogin] = useState(user?.role === "admin");
  const [result, setResult] = useState({ status: "ready", message: token ? "Confirm your new email address. This signs out your existing sessions." : "This email change link is incomplete." });
  const busy = useRef(false);
  const confirm = async () => {
    if (busy.current || !token) return;
    busy.current = true;
    setResult({ status: "saving", message: "Updating your email…" });
    try {
      const { data } = await api.post("/auth/confirm-email-change", { token });
      setAdminLogin(data.adminLoginRequired === true);
      setUser(null);
      setResult({ status: "success", message: data.message });
    } catch (error) {
      setResult({ status: "error", message: errorMessage(error) });
    } finally { busy.current = false; }
  };
  return (
    <>
      <SectionLabel as="p">Email</SectionLabel>
      <h2 className="mt-1 mb-2 font-display text-2xl font-medium">{result.status === "success" ? "Email updated" : "Confirm email change"}</h2>
      <p role={result.status === "error" ? "alert" : "status"} className="mb-6 text-[15px] text-secondary">{result.message}</p>
      {token && result.status !== "success" && <Button block disabled={result.status === "saving"} onClick={confirm}>{result.status === "saving" ? "Updating…" : "Confirm Email"}</Button>}
      <Button block to={adminLogin ? "/admin/login" : "/login"} variant={result.status === "success" ? "primary" : "ghost"} className="mt-3">{adminLogin ? "Admin Access" : "Log In"}</Button>
    </>
  );
}

export default ChangeEmailPage;
