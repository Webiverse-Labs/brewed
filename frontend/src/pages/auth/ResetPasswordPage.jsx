import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import SectionLabel from "../../components/ui/SectionLabel.jsx";
import Field from "../../components/ui/Field.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import Button from "../../components/ui/Button.jsx";
import api, { errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";

// Landing page of the link in the reset email. A successful reset also logs the user in.
function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [linkError, setLinkError] = useState(token ? null : "This reset link is incomplete.");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { password } = Object.fromEntries(new FormData(e.currentTarget));
    setSubmitting(true);
    try {
      const { data } = await api.post("/auth/reset-password", { token, password });
      setUser(data.user);
      toast.success("Password updated. You're logged in.");
      navigate(data.user.role === "admin" ? "/admin" : "/", { replace: true });
    } catch (err) {
      const message = errorMessage(err);
      // a bad or expired link can't be retried; a too-short password can
      if (err.response?.status === 400 && /link/.test(message)) setLinkError(message);
      else toast.error(message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <SectionLabel as="p">Password</SectionLabel>
      <h2 className="mt-1 mb-2 font-display text-2xl font-medium">Choose a new password</h2>
      {linkError ? (
        <>
          <p className="mb-6 text-[15px] text-secondary">{linkError} Reset links work once and expire after an hour.</p>
          <Button to="/forgot-password" block>
            Get a New Link
          </Button>
        </>
      ) : (
        <>
          <p className="mb-6 text-[15px] text-secondary">You'll be logged in once it's saved.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="New Password" hint="At least 8 characters">
              <PasswordInput name="password" required minLength={8} placeholder="Create a password" autoComplete="new-password" />
            </Field>
            <Button type="submit" block className="mt-1" disabled={submitting}>
              {submitting ? "Saving…" : "Save Password"}
            </Button>
          </form>
        </>
      )}
      <Link to="/login" className="mt-4 block text-center text-sm text-secondary hover:text-base-content">
        ← Back to Log In
      </Link>
    </>
  );
}

export default ResetPasswordPage;
