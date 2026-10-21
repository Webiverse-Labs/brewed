import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Field from "../../components/ui/Field.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import Button from "../../components/ui/Button.jsx";
import GoogleButton from "../../components/auth/GoogleButton.jsx";
import PolicyAgreement, { PolicyAgreementText } from "../../components/auth/PolicyAgreement.jsx";
import { errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useConfirmation } from "../../hooks/useConfirmation.js";

const modes = [
  { value: "signup", label: "Sign Up" },
  { value: "login", label: "Log In" },
];

// Serves both /signup and /login; the mode comes from the path.
function AuthPage() {
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const { login, signup, loginWithGoogle } = useAuth();
  const confirm = useConfirmation();
  const [submitting, setSubmitting] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const agreementRef = useRef(null);
  const isSignup = pathname === "/signup";

  const acceptPolicies = () => confirm({
    title: "Accept Brewed's policies?",
    description: <>
      Review the links below before continuing. Selecting Accept confirms your agreement.
      <p className="mt-4"><PolicyAgreementText /></p>
    </>,
    confirmLabel: "Accept",
    onConfirm: () => {
      setAcceptedPolicies(true);
      toast.dismiss("signup-policies");
    },
  });

  const changeAgreement = (checked) => {
    if (checked) return acceptPolicies();
    setAcceptedPolicies(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const { name, email, password, confirmPassword } = Object.fromEntries(new FormData(form));
    const requiredFields = isSignup
      ? [["name", name], ["email", email], ["password", password], ["confirmPassword", confirmPassword]]
      : [["email", email], ["password", password]];
    const missingField = requiredFields.find(([, value]) => !String(value ?? "").trim());
    const reminderId = isSignup ? "signup-required-fields" : "login-required-fields";
    if (missingField) {
      toast.error(`Please fill out all fields before ${isSignup ? "signing up" : "logging in"}.`, { id: reminderId });
      form.elements.namedItem(missingField[0])?.focus();
      return;
    }
    toast.dismiss(reminderId);
    if (isSignup && password.length < 8) {
      toast.error("Password must be at least 8 characters.", { id: "signup-password-length" });
      form.elements.namedItem("password")?.focus();
      return;
    }
    toast.dismiss("signup-password-length");
    if (isSignup && password !== confirmPassword) {
      toast.error("Passwords don't match.", { id: "signup-password-mismatch" });
      form.elements.namedItem("confirmPassword")?.focus();
      return;
    }
    toast.dismiss("signup-password-mismatch");
    if (isSignup && !acceptedPolicies) {
      toast.error("Please accept the Terms & Privacy Policy.", { id: "signup-policies" });
      agreementRef.current?.focus();
      return;
    }
    toast.dismiss("signup-policies");
    // Preserve the remaining browser validation, including email format.
    if (!form.reportValidity()) return;
    setSubmitting(true);
    try {
      const user = isSignup ? await signup({ name, email, password, acceptedPolicies }) : await login(email, password);
      toast.success(isSignup ? "Welcome to Brewed!" : `Welcome back, ${user.name.split(" ")[0]}!`);
      //back to the page that sent them to log in, if any
      navigate(state?.from?.pathname ?? "/", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
      setSubmitting(false);
    }
  };

  const completeGoogle = async (credential, policyAccepted) => {
    const { user, isNew } = await loginWithGoogle(credential, { acceptedPolicies: policyAccepted });
    toast.success(isNew ? "Welcome to Brewed!" : `Welcome back, ${user.name.split(" ")[0]}!`);
    navigate(state?.from?.pathname ?? "/", { replace: true });
  };

  const handleGoogle = async (credential) => {
    if (submitting) return;
    if (isSignup && !acceptedPolicies && !(await acceptPolicies())) return;
    setSubmitting(true);
    try {
      await completeGoogle(credential, isSignup);
    } catch (err) {
      if (err.response?.data?.code === "POLICY_ACCEPTANCE_REQUIRED") {
        // Google also allows new accounts from /login. Ask before creating one there.
        await confirm({
          title: "Create your Brewed account?",
          description: "This Google account is new to Brewed. Review and accept the policies before creating an account.",
          checkboxLabel: <PolicyAgreementText />,
          confirmLabel: "Accept and Create Account",
          pendingLabel: "Creating account…",
          onConfirm: () => completeGoogle(credential, true),
        });
      } else {
        toast.error(errorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SegmentedControl
        label="Sign up or log in"
        options={modes}
        value={isSignup ? "signup" : "login"}
        onChange={(mode) => {
          setAcceptedPolicies(false);
          navigate(`/${mode}`, { replace: true, state });
        }}
        className="mb-6"
      />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {isSignup && (
          <Field label="Display Name">
            <TextInput name="name" required placeholder="Choose a display name" autoComplete="nickname" />
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
        {isSignup && (
          <Field label="Confirm Password">
            <PasswordInput
              name="confirmPassword"
              required
              minLength={8}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
          </Field>
        )}
        {isSignup && (
          <PolicyAgreement
            checked={acceptedPolicies}
            onChange={changeAgreement}
            inputRef={agreementRef}
            disabled={submitting}
          />
        )}
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
