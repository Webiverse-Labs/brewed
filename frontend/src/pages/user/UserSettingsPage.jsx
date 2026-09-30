import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import Page from "../../components/layout/Page.jsx";
import PageTitle from "../../components/layout/PageTitle.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import ProfileSettingsForm from "../../components/user/ProfileSettingsForm.jsx";
import SecuritySettings from "../../components/user/SecuritySettings.jsx";
import { cn } from "../../lib/cn.js";

const sections = [
  { value: "profile", label: "Profile", icon: UserRound },
  { value: "security", label: "Security", icon: Lock },
];

function UserSettingsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const tab = params.get("tab") === "security" ? "security" : "profile";

  const deleteAccount = () => {
    // TODO(api): DELETE /api/users/me
    setConfirmOpen(false);
    toast("Your account has been deleted.");
    navigate("/signup");
  };

  return (
    <Page width="medium">
      <PageTitle title="Settings" />

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <nav aria-label="Settings sections" className="flex flex-col gap-1">
          {sections.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-current={tab === value ? "page" : undefined}
              onClick={() => setParams({ tab: value }, { replace: true })}
              className={cn(
                "flex h-11 items-center gap-3 rounded-field px-4 text-[15px] transition-colors",
                "focus-visible:outline-2 focus-visible:outline-accent",
                tab === value ? "bg-primary text-primary-content" : "hover:bg-base-200",
              )}
            >
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>

        <div className="rounded-box border border-base-300 bg-surface p-5 md:p-6">
          {tab === "profile" ? <ProfileSettingsForm /> : <SecuritySettings onDeleteAccount={() => setConfirmOpen(true)} />}
        </div>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete account" size="sm">
        <p className="text-[15px]">Are you sure? This cannot be undone.</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteAccount}>
            Yes, Delete
          </Button>
        </div>
      </Modal>
    </Page>
  );
}

export default UserSettingsPage;
