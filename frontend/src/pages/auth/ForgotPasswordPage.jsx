import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import SectionLabel from "../../components/ui/SectionLabel.jsx";
import Field from "../../components/ui/Field.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import Button from "../../components/ui/Button.jsx";
import api, { errorMessage } from "../../lib/api.js";

function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email } = Object.fromEntries(new FormData(e.currentTarget));
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSentTo(email);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SectionLabel as="p">Password</SectionLabel>
      <h2 className="mt-1 mb-2 font-display text-2xl font-medium">Forgot your password?</h2>
      {sentTo ? (
        <p className="mb-6 text-[15px] text-secondary">
          If an account exists for <strong className="font-medium break-all text-base-content">{sentTo}</strong>, a reset
          link is on its way. It works for 1 hour.
        </p>
      ) : (
        <>
          <p className="mb-6 text-[15px] text-secondary">Enter your email and we'll send you a link to choose a new one.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Email">
              <TextInput type="email" name="email" required placeholder="you@example.com" autoComplete="email" />
            </Field>
            <Button type="submit" block className="mt-1" disabled={submitting}>
              {submitting ? "Sending…" : "Send Reset Link"}
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

export default ForgotPasswordPage;
