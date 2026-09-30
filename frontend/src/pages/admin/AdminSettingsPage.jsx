import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import Field from "../../components/ui/Field.jsx";
import SectionLabel from "../../components/ui/SectionLabel.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import api, { errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";

function AdminSettingsPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    setSaving(true);
    try {
      const { data } = await api.patch("/admin/me", fields);
      setUser(data.user);
      toast.success("Settings saved.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    if (await logout()) navigate("/admin/login");
  };

  return (
    <>
      <AdminHeader title="Admin Settings" subtitle="Manage administrator preferences and account" />

      <section className="max-w-xl rounded-box border border-base-300 bg-surface p-5 md:p-6">
        <SectionLabel>Administrator Account</SectionLabel>
        <div className="mt-4 flex items-center gap-4">
          <Avatar name={user.name} src={user.avatarUrl} tone="primary" size="lg" />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-medium">{user.name}</p>
            <p className="truncate text-sm text-secondary">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Field label="Display Name">
            <TextInput name="name" required defaultValue={user.name} />
          </Field>
          <Field label="Email">
            <TextInput type="email" name="email" required defaultValue={user.email} />
          </Field>
          <Button type="submit" className="self-start" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </section>

      <p className="mt-4 text-sm text-secondary">
        You are currently signed in as {user.name}.{" "}
        <button type="button" onClick={signOut} className="font-medium text-accent hover:underline">
          Sign out
        </button>
      </p>
    </>
  );
}

export default AdminSettingsPage;
