import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import Page from "../../components/layout/Page.jsx";
import PageTitle from "../../components/layout/PageTitle.jsx";
import ProfileSettingsForm from "../../components/user/ProfileSettingsForm.jsx";
import SecuritySettings from "../../components/user/SecuritySettings.jsx";
import api from "../../lib/api.js";
import { cn } from "../../lib/cn.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useConfirmation } from "../../hooks/useConfirmation.js";

const sections = [
  { value: "profile", label: "Profile", icon: UserRound },
  { value: "security", label: "Security", icon: Lock },
];

function UserSettingsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const confirm = useConfirmation();
  const tab = params.get("tab") === "security" ? "security" : "profile";

  const deleteAccount = () => confirm({
    title: "Permanently delete your account?",
    description: <>
      <strong className="text-base-content">{user.email}</strong>
      <p className="mt-3">Your account, visit logs, follows, related notifications, avatar, and visit photos will be permanently deleted. Café suggestions and published café listings may remain.</p>
      <p className="mt-3 font-medium text-error">This action cannot be undone.</p>
    </>,
    confirmLabel: "Delete My Account",
    pendingLabel: "Deleting account…",
    danger: true,
    verificationText: "DELETE",
    onConfirm: async () => {
      await api.delete("/users/me");
      //clear the user and leave in the same update, so the guards don't bounce us to /login first
      setUser(null);
      navigate("/signup", { replace: true });
      toast("Your account has been deleted.");
    },
  });

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
          {tab === "profile" ? <ProfileSettingsForm /> : <SecuritySettings onDeleteAccount={deleteAccount} />}
        </div>
      </div>

    </Page>
  );
}

export default UserSettingsPage;
