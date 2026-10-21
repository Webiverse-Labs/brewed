import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../ui/Button.jsx";
import Field from "../ui/Field.jsx";
import PasswordInput from "../ui/PasswordInput.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";
import TextInput from "../ui/TextInput.jsx";
import ValidationReminder from "../ui/ValidationReminder.jsx";
import api from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useConfirmation } from "../../hooks/useConfirmation.js";

function EmailSettings() {
  const { user, updateUser } = useAuth();
  const confirm = useConfirmation();
  const [saving, setSaving] = useState(false);
  const [reminder, setReminder] = useState(null);
  const hasPassword = user.hasPassword !== false;

  const requestChange = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (saving) return;
    const fields = new FormData(form);
    const email = fields.get("email").trim().toLowerCase();
    const emailField = form.elements.namedItem("email");
    const passwordField = form.elements.namedItem("emailCurrentPassword");
    if (!email) return setReminder({ message: "Enter your new email address.", field: emailField });
    if (email.length > 254) return setReminder({ message: "Email addresses must be no more than 254 characters.", field: emailField });
    if (!emailField.validity.valid) return setReminder({ message: "Enter a valid email address.", field: emailField });
    if (email === user.email.toLowerCase()) return setReminder({ message: "Enter an email address different from your current one.", field: emailField });
    if (!passwordField.value) return setReminder({ message: "Enter your current password to update your email.", field: passwordField });
    await confirm({
      title: "Update your email?",
      description: <>We'll send a confirmation link to <strong className="break-all text-base-content">{email}</strong>. Your current email stays active until you confirm the new address.</>,
      confirmLabel: "Send Confirmation",
      pendingLabel: "Sending confirmation…",
      onConfirm: async () => {
        setSaving(true);
        try {
          const { data } = await api.patch("/users/me/email", { email, currentPassword: fields.get("emailCurrentPassword") });
          updateUser({ pendingEmail: data.user.pendingEmail });
          form.reset();
          toast.success("Confirmation sent. Check your new email.");
        } finally { setSaving(false); }
      },
    });
  };

  const cancelChange = () => confirm({
    title: "Cancel this email change?",
    description: "The confirmation link will stop working. Your current email will stay the same.",
    confirmLabel: "Cancel Email Change",
    pendingLabel: "Cancelling…",
    onConfirm: async () => {
      await api.delete("/users/me/email");
      updateUser({ pendingEmail: undefined });
      toast.success("Email change cancelled.");
    },
  });

  return (
    <section className="flex flex-col gap-4" aria-label="Update email">
      <SectionLabel>Update Email</SectionLabel>
      <p className="text-[13px] text-secondary">Current email: <strong className="break-all font-medium text-base-content">{user.email}</strong></p>
      {user.pendingEmail && (
        <div role="status" className="rounded-box border border-base-300 bg-base-100 p-4 text-sm">
          <p>Waiting for confirmation from <strong className="break-all">{user.pendingEmail}</strong>.</p>
          <p className="mt-1 text-xs text-secondary">The link expires after 24 hours. Your current email still works. You can request another link after one minute.</p>
          <button type="button" onClick={cancelChange} className="mt-2 font-medium text-accent hover:underline">Cancel Email Change</button>
        </div>
      )}
      {hasPassword ? (
        <form onSubmit={requestChange} noValidate className="flex flex-col gap-4">
          <Field label="New Email">
            <TextInput type="email" name="email" required maxLength={254} autoComplete="email" placeholder="Enter your new email address" disabled={saving} />
          </Field>
          <Field label="Current Password">
            <PasswordInput name="emailCurrentPassword" required autoComplete="current-password" disabled={saving} />
          </Field>
          <p className="text-[13px] text-secondary">Confirm the link sent to your new email, then sign in again.</p>
          <Button type="submit" className="self-start" disabled={saving}>{saving ? "Sending…" : "Update Email"}</Button>
        </form>
      ) : (
        <p className="text-[13px] text-secondary">You signed in with Google. <a href="#password-settings" className="font-medium text-accent underline">Set an account password below</a> before updating your email. Your Google sign-in will stay connected.</p>
      )}
      {reminder && <ValidationReminder {...reminder} onClose={() => setReminder(null)} />}
    </section>
  );
}

export default EmailSettings;
