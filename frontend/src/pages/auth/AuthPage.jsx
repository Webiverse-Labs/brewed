import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Field from "../../components/ui/Field.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import Button from "../../components/ui/Button.jsx";
import GoogleButton from "../../components/auth/GoogleButton.jsx";
import { errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";

const modes = [
  { value: "signup", label: "Sign Up" },
  { value: "login", label: "Log In" },
];

// Serves both /signup and /login; the mode comes from the path.
function AuthPage() {
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const { login, signup, loginWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const isSignup = pathname === "/signup";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = Object.fromEntries(new FormData(e.currentTarget));
    setSubmitting(true);
    try {
      const user = isSignup ? await signup({ name, email, password }) : await login(email, password);
      toast.success(isSignup ? "Welcome to Brewed!" : `Welcome back, ${user.name.split(" ")[0]}!`);
      //back to the page that sent them to log in, if any
      navigate(state?.from?.pathname ?? "/", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
      setSubmitting(false);
    }
  };

  const handleGoogle = async (credential) => {
    setSubmitting(true);
    try {
      const { user, isNew } = await loginWithGoogle(credential);
      toast.success(isNew ? "Welcome to Brewed!" : `Welcome back, ${user.name.split(" ")[0]}!`);
      navigate(state?.from?.pathname ?? "/", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <>
      <SegmentedControl
        label="Sign up or log in"
        options={modes}
        value={isSignup ? "signup" : "login"}
        onChange={(mode) => navigate(`/${mode}`, { replace: true, state })}
        className="mb-6"
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isSignup && (
          <Field label="Full Name">
            <TextInput name="name" required placeholder="Ada Lovelace" autoComplete="name" />
          </Field>
        )}
        <Field label="Email">
          <TextInput
            type="email"
            name="email"
            required
            placeholder={isSignup ? "ada@example.com" : "you@example.com"}
            autoComplete="email"
          />
        </Field>
        <Field label="Password" hint={isSignup ? "At least 8 characters" : undefined}>
          <PasswordInput
            name="password"
            required
            minLength={isSignup ? 8 : undefined}
            placeholder={isSignup ? "Create a password" : "Your password"}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </Field>
        <Button type="submit" block className="mt-1" disabled={submitting}>
          {submitting ? "Please wait…" : isSignup ? "Create Account" : "Log In"}
        </Button>
        {!isSignup && (
          <p className="text-center text-sm text-secondary">
            Forgot your password?{" "}
            <Link to="/forgot-password" className="font-medium text-accent hover:underline">
              Reset it
            </Link>
          </p>
        )}
      </form>
      {/* renders nothing unless VITE_GOOGLE_CLIENT_ID is set, so the divider lives in the same wrapper */}
      {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <div className="mt-5 flex flex-col gap-4">
          <p className="flex items-center gap-3 text-xs text-muted before:h-px before:flex-1 before:bg-base-300 after:h-px after:flex-1 after:bg-base-300">
            or
          </p>
          <GoogleButton text={isSignup ? "signup_with" : "signin_with"} onCredential={handleGoogle} />
        </div>
      )}
    </>
  );
}

export default AuthPage;
