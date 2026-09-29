import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Field from "../../components/ui/Field.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import Button from "../../components/ui/Button.jsx";

const modes = [
  { value: "signup", label: "Sign Up" },
  { value: "login", label: "Log In" },
];

// Serves both /signup and /login; the mode comes from the path.
function AuthPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const signup = pathname === "/signup";

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO(api): POST /api/auth/signup | /api/auth/login
    toast.success(signup ? "Welcome to Brewed!" : "Welcome back!");
    navigate("/");
  };

  return (
    <>
      <SegmentedControl
        label="Sign up or log in"
        options={modes}
        value={signup ? "signup" : "login"}
        onChange={(mode) => navigate(`/${mode}`, { replace: true })}
        className="mb-6"
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {signup && (
          <Field label="Full Name">
            <TextInput name="name" required placeholder="Ada Lovelace" autoComplete="name" />
          </Field>
        )}
        <Field label="Email">
          <TextInput
            type="email"
            name="email"
            required
            placeholder={signup ? "ada@example.com" : "you@example.com"}
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <PasswordInput
            name="password"
            required
            placeholder={signup ? "Create a password" : "Your password"}
            autoComplete={signup ? "new-password" : "current-password"}
          />
        </Field>
        <Button type="submit" block className="mt-1">
          {signup ? "Create Account" : "Log In"}
        </Button>
        {!signup && (
          <p className="text-center text-sm text-secondary">
            Forgot your password?{" "}
            <button
              type="button"
              onClick={() => toast("Password reset is coming soon.")}
              className="font-medium text-accent hover:underline"
            >
              Reset it
            </button>
          </p>
        )}
      </form>
    </>
  );
}

export default AuthPage;
