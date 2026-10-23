import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../ui/Button.jsx";
import Field from "../ui/Field.jsx";
import PasswordInput from "../ui/PasswordInput.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";
import ValidationReminder from "../ui/ValidationReminder.jsx";
import EmailSettings from "../user/EmailSettings.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useConfirmation } from "../../hooks/useConfirmation.js";
import api from "../../lib/api.js";

function AdminSecuritySettings() {
  const { updateUser, logout } = useAuth();
  const confirm = useConfirmation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const [reminder, setReminder] = useState(null);
  const changePassword = async (event) => {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const missing = ["current", "next", "confirm"].map((name) => form.elements.namedItem(name)).find((field) => !field.value);
    if (missing) return setReminder({ message: "Please fill out all password fields before continuing.", field: missing });
    if (fields.get("next").length < 8) return setReminder({ message: "Your new password must be at least 8 characters.", field: form.elements.namedItem("next") });
    if (fields.get("next") !== fields.get("confirm")) return setReminder({ message: "New passwords don't match. Re-enter your new password.", field: form.elements.namedItem("confirm") });
    if (fields.get("next") === fields.get("current")) return setReminder({ message: "Choose a password different from your current one.", field: form.elements.namedItem("next") });
    await confirm({
      title: "Change your admin password?",
      description: "Your password will change and other devices will be signed out. This browser will stay signed in. Any pending email change will be cancelled.",
      confirmLabel: "Change Password", pendingLabel: "Updating password…",
      onConfirm: async () => {
        setBusy("password");
        try {
          await api.patch("/admin/me/password", { current: fields.get("current"), next: fields.get("next") });
          updateUser({ hasPassword: true, pendingEmail: undefined });
          form.reset();
          toast.success("Password updated. Other devices have been signed out.");
        } finally { setBusy(null); }
      },
    });
  };
  const signOutOthers = async (event) => {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const password = form.elements.namedItem("sessionsPassword");
    if (!password.value) return setReminder({ message: "Enter your current password to sign out other devices.", field: password });
    const currentPassword = password.value;
    await confirm({
      title: "Sign out other devices?", description: "Other signed-in browsers and devices will need to log in again. This browser will stay signed in.",
      confirmLabel: "Sign Out Other Devices", pendingLabel: "Signing out…",
      onConfirm: async () => {
        setBusy("sessions");
        try {
          await api.post("/admin/me/sign-out-others", { currentPassword });
          form.reset();
          toast.success("Other devices have been signed out.");
        } finally { setBusy(null); }
      },
    });
  };
  const signOut = async () => { if (await logout()) navigate("/admin/login"); };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0 rounded-box border border-base-300 bg-surface p-5 md:p-6">
        <EmailSettings admin />
      </div>
      <form onSubmit={changePassword} noValidate className="flex min-w-0 flex-col gap-4 rounded-box border border-base-300 bg-surface p-5 md:p-6" aria-label="Change admin password">
        <div className="flex flex-col gap-2">
          <SectionLabel>Change Password</SectionLabel>
          <p className="text-[13px] text-secondary">Update your password to keep your account secure.</p>
        </div>
        <Field label="Current Password"><PasswordInput name="current" required autoComplete="current-password" disabled={Boolean(busy)} /></Field>
        <Field label="New Password" hint="Use at least 8 characters."><PasswordInput name="next" required minLength={8} maxLength={72} autoComplete="new-password" disabled={Boolean(busy)} /></Field>
        <Field label="Confirm New Password"><PasswordInput name="confirm" required autoComplete="new-password" disabled={Boolean(busy)} /></Field>
        <Button type="submit" className="mt-auto self-start" disabled={Boolean(busy)}>{busy === "password" ? "Updating…" : "Update Password"}</Button>
      </form>
      <section className="min-w-0 rounded-box border border-base-300 bg-surface p-5 md:p-6 lg:col-span-2" aria-label="Account sessions">
        <form onSubmit={signOutOthers} noValidate className="grid items-start gap-6 xl:grid-cols-2" aria-label="Sign out other devices">
          <div className="flex flex-col gap-2">
            <SectionLabel>Other Devices</SectionLabel>
            <p className="max-w-md text-sm text-secondary">End your other sessions while keeping this browser signed in.</p>
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <Field label="Current Password"><PasswordInput name="sessionsPassword" required autoComplete="current-password" disabled={Boolean(busy)} /></Field>
            <Button type="submit" variant="outline" className="self-start" disabled={Boolean(busy)}>{busy === "sessions" ? "Signing out…" : "Sign Out Other Devices"}</Button>
          </div>
        </form>
        <div className="mt-6 flex flex-col items-start gap-4 border-t border-base-300 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Current Session</h3>
            <p className="text-sm text-secondary">Sign out of your administrator account on this browser.</p>
          </div>
          <Button variant="outline" onClick={signOut}>Sign Out</Button>
        </div>
      </section>
      {reminder && <ValidationReminder {...reminder} onClose={() => setReminder(null)} />}
    </div>
  );
}

export default AdminSecuritySettings;
