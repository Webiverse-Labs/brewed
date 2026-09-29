import toast from "react-hot-toast";
import Field from "../ui/Field.jsx";
import PasswordInput from "../ui/PasswordInput.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";
import Button from "../ui/Button.jsx";

function SecuritySettings({ onDeleteAccount }) {
  const handlePassword = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (data.get("next") !== data.get("confirm")) return toast.error("New passwords don't match.");
    // TODO(api): PATCH /api/users/me/password
    toast.success("Password updated.");
    form.reset();
  };

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handlePassword} className="flex flex-col gap-4">
        <SectionLabel>Update Password</SectionLabel>
        <Field label="Current Password">
          <PasswordInput name="current" required placeholder="••••••••" autoComplete="current-password" />
        </Field>
        <Field label="New Password">
          <PasswordInput name="next" required minLength={8} autoComplete="new-password" />
        </Field>
        <Field label="Confirm New Password">
          <PasswordInput name="confirm" required minLength={8} autoComplete="new-password" />
        </Field>
        <Button type="submit" className="self-start">
          Update Password
        </Button>
      </form>

      <div className="flex items-center justify-between gap-4 border-t border-base-300 pt-6">
        <div>
          <p className="text-[15px] font-medium">Log Out</p>
          <p className="text-[13px] text-secondary">You can log back in anytime.</p>
        </div>
        <Button to="/login" variant="outline" size="sm" shape="pill">
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
