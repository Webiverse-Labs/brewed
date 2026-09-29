import { Link, useNavigate } from "react-router-dom";
import SectionLabel from "../../components/ui/SectionLabel.jsx";
import Field from "../../components/ui/Field.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import Button from "../../components/ui/Button.jsx";

function AdminLoginPage() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO(api): POST /api/admin/login
    navigate("/admin");
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
        <Button type="submit" block className="mt-1">
          Access Dashboard
        </Button>
        <Link to="/signup" className="text-center text-sm text-secondary hover:text-base-content">
          ← Back to Sign Up
        </Link>
      </form>
    </>
  );
}

export default AdminLoginPage;
