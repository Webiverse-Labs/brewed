import { useEffect, useRef, useState } from "react";
import SectionLabel from "../../components/ui/SectionLabel.jsx";
import Button from "../../components/ui/Button.jsx";
import Loader from "../../components/ui/Loader.jsx";
import api, { errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useEmailLinkToken } from "../../hooks/useEmailLinkToken.js";

// Landing page of the link in the verification email. Works logged out too (the token alone proves the inbox).
function VerifyEmailPage() {
  const token = useEmailLinkToken();
  const { user, refresh } = useAuth();
  const [result, setResult] = useState(token ? { status: "verifying" } : { status: "error", message: "This verification link is incomplete." });
  // StrictMode runs effects twice in dev: send the request only once
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    api
      .post("/auth/verify-email", { token })
      .then(() => {
        setResult({ status: "success" });
        return refresh(); // if they're logged in here, clear the banner
      })
      .catch((err) => setResult({ status: "error", message: errorMessage(err) }));
  }, [token, refresh]);

  // success only ever means this link's token was accepted (the API accepts the same link again until it expires)
  const verified = result.status === "success";

  return (
    <>
      <SectionLabel as="p">Email</SectionLabel>
      {result.status === "verifying" ? (
        <Loader className="py-10" />
      ) : (
        <>
          <h2 className="mt-1 mb-2 font-display text-2xl font-medium">{verified ? "Email verified" : "Link didn't work"}</h2>
          <p className="mb-6 text-[15px] text-secondary">
            {verified
              ? "Thanks! You can now post reviews, suggest cafés and follow people."
              : `${result.message} ${
                  user?.emailVerified
                    ? "Your own email is already verified, so you don't need it."
                    : user
                      ? "Use the banner at the top to get a new one."
                      : "Log in to ask for a new one."
                }`}
          </p>
          <Button to={user ? "/" : "/login"} block>
            {user ? "Continue to Brewed" : "Log In"}
          </Button>
        </>
      )}
    </>
  );
}

export default VerifyEmailPage;
