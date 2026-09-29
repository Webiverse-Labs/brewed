import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import Field from "../../components/ui/Field.jsx";
import SectionLabel from "../../components/ui/SectionLabel.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import { admin } from "../../data/mock.js";

function AdminSettingsPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO(api): PATCH /api/admin/me
    toast.success("Settings saved.");
  };

  return (
    <>
      <AdminHeader title="Admin Settings" subtitle="Manage administrator preferences and account" />

      <section className="max-w-xl rounded-box border border-base-300 bg-surface p-5 md:p-6">
        <SectionLabel>Administrator Account</SectionLabel>
        <div className="mt-4 flex items-center gap-4">
          <Avatar initials={admin.initials} tone="primary" size="lg" />
          <div>
            <p className="font-display text-lg font-medium">{admin.name}</p>
            <p className="text-sm text-secondary">{admin.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Field label="Display Name">
            <TextInput name="name" required defaultValue={admin.name} />
          </Field>
          <Field label="Email">
            <TextInput type="email" name="email" required defaultValue={admin.email} />
          </Field>
          <Button type="submit" className="self-start">
            Save Changes
          </Button>
        </form>
      </section>

      <p className="mt-4 text-sm text-secondary">
        You are currently signed in as {admin.name}.{" "}
        <Link to="/admin/login" className="font-medium text-accent hover:underline">
          Sign out
        </Link>
      </p>
    </>
  );
}

export default AdminSettingsPage;
