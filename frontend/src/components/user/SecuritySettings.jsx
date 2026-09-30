import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Field from "../ui/Field.jsx";
import PasswordInput from "../ui/PasswordInput.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";
import Button from "../ui/Button.jsx";
import api, { errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";

function SecuritySettings({ onDeleteAccount }) {
  const { user, updateUser, logout } = useAuth();
  // accounts created with Google have no password yet; this form is how they add one
  const hasPassword = user.hasPassword !== false;
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handlePassword = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (data.get("next") !== data.get("confirm")) return toast.error("New passwords don't match.");

    setSaving(true);
    try {
      await api.patch("/users/me/password", { current: data.get("current"), next: data.get("next") });
      updateUser({ hasPassword: true });
      toast.success(hasPassword ? "Password updated." : "Password set. You can now log in with your email too.");
      form.reset();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (await logout()) navigate("/login");
  };

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handlePassword} className="flex flex-col gap-4">
        <SectionLabel>{hasPassword ? "Update Password" : "Set a Password"}</SectionLabel>
        {!hasPassword && (
          <p className="-mt-2 text-[13px] text-secondary">
            You signed in with Google. Set a password if you also want to log in with your email.
          </p>
        )}
        {hasPassword && (
          <Field label="Current Password">
            <PasswordInput name="current" required placeholder="••••••••" autoComplete="current-password" />
          </Field>
        )}
        <Field label="New Password">
          <PasswordInput name="next" required minLength={8} autoComplete="new-password" />
        </Field>
        <Field label="Confirm New Password">
          <PasswordInput name="confirm" required minLength={8} autoComplete="new-password" />
        </Field>
        <Button type="submit" className="self-start" disabled={saving}>
          {saving ? "Saving…" : hasPassword ? "Update Password" : "Set Password"}
        </Button>
      </form>

      <div className="flex items-center justify-between gap-4 border-t border-base-300 pt-6">
        <div>
          <p className="text-[15px] font-medium">Log Out</p>
          <p className="text-[13px] text-secondary">You can log back in anytime.</p>
        </div>
        <Button onClick={handleLogout} variant="outline" size="sm" shape="pill">
          Log Out
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-box border border-error/20 bg-error/5 p-4">
        <div>
          <p className="text-[15px] font-medium text-error">Delete Account</p>
          <p className="text-[13px] text-secondary">This action is permanent and cannot be undone.</p>
        </div>
        <Button variant="dangerSoft" size="sm" shape="pill" onClick={onDeleteAccount}>
          Delete
        </Button>
      </div>
    </div>
  );
}

export default SecuritySettings;
