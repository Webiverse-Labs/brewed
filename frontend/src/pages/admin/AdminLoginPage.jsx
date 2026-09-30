import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SectionLabel from "../../components/ui/SectionLabel.jsx";
import Field from "../../components/ui/Field.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import Button from "../../components/ui/Button.jsx";
import { errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";

function AdminLoginPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(e.currentTarget));
    setSubmitting(true);
    try {
      await login(email, password, { admin: true });
      navigate(state?.from?.pathname ?? "/admin", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <>
      <SectionLabel as="p">Admin Access</SectionLabel>
      <h2 className="mt-1 mb-6 font-display text-2xl font-medium">Dashboard Login</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Admin Email">
          <TextInput type="email" name="email" required placeholder="admin@brewed.app" autoComplete="email" />
        </Field>
        <Field label="Password">
          <PasswordInput name="password" required placeholder="Admin password" autoComplete="current-password" />
        </Field>
        <Button type="submit" block className="mt-1" disabled={submitting}>
          {submitting ? "Checking…" : "Access Dashboard"}
        </Button>
        <Link to="/signup" className="text-center text-sm text-secondary hover:text-base-content">
          ← Back to Sign Up
        </Link>
      </form>
    </>
  );
}

export default AdminLoginPage;
