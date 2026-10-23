import { useSearchParams } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import AdminProfileSettings from "../../components/admin/AdminProfileSettings.jsx";
import AdminSecuritySettings from "../../components/admin/AdminSecuritySettings.jsx";
import FilterTabs from "../../components/ui/FilterTabs.jsx";

const tabs = [{ value: "profile", label: "Profile" }, { value: "security", label: "Security" }];

function AdminSettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "security" ? "security" : "profile";

  return (
    <div className="w-full max-w-6xl">
      <AdminHeader title="Admin Settings" subtitle="Manage your administrator profile and account security" />
      <FilterTabs tabs={tabs} value={tab} onChange={(value) => setParams({ tab: value })} label="Admin settings sections" className="mb-6" />
      {tab === "profile" ? <AdminProfileSettings /> : <AdminSecuritySettings />}
    </div>
  );
}

export default AdminSettingsPage;
