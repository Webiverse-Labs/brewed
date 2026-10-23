import { useState } from "react";
import toast from "react-hot-toast";
import Avatar from "../ui/Avatar.jsx";
import Button from "../ui/Button.jsx";
import Field from "../ui/Field.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";
import TextInput from "../ui/TextInput.jsx";
import UserDisplayName from "../ui/UserDisplayName.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import api, { errorMessage } from "../../lib/api.js";
import { shrinkImage } from "../../lib/shrinkImage.js";

function AdminProfileSettings() {
  const { user, setUser } = useAuth();
  const [busy, setBusy] = useState(null);
  const saveProfile = async (event) => {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy("profile");
    try {
      const { data } = await api.patch("/admin/me", { name: fields.get("name").trim() });
      setUser(data.user);
      toast.success("Profile saved.");
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setBusy(null); }
  };
  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    setBusy("avatar");
    try {
      const body = new FormData();
      body.set("avatar", await shrinkImage(file));
      const { data } = await api.post("/admin/me/avatar", body);
      setUser(data.user);
      toast.success("Profile photo updated.");
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setBusy(null); }
  };
  return (
    <section className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-6 rounded-box border border-base-300 bg-surface p-5 md:p-6" aria-label="Administrator profile">
      <div className="flex flex-col gap-2">
        <SectionLabel>Administrator Profile</SectionLabel>
        <p className="text-sm text-secondary">Manage the name and photo shown on your account.</p>
      </div>
      <div className="flex flex-col items-start gap-4 border-b border-base-300 pb-6 sm:flex-row sm:items-center">
        <Avatar name={user.name} src={user.avatarUrl} tone="primary" size="lg" />
        <div className="min-w-0 max-w-full">
          <p className="font-display text-lg font-medium"><UserDisplayName user={user} /></p>
          <label className="mt-2 inline-flex cursor-pointer items-center rounded-full border border-base-300 px-3.5 py-2 text-sm font-medium hover:bg-base-200 focus-within:outline-2 focus-within:outline-accent">
            {busy === "avatar" ? "Uploading…" : "Change Profile Photo"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={Boolean(busy)} onChange={uploadAvatar} />
          </label>
        </div>
      </div>
      <form onSubmit={saveProfile} className="flex flex-col gap-5">
        <Field label="Display Name"><TextInput name="name" required maxLength={80} defaultValue={user.name} autoComplete="name" disabled={Boolean(busy)} /></Field>
        <Button type="submit" className="self-start" disabled={Boolean(busy)}>{busy === "profile" ? "Saving…" : "Save Changes"}</Button>
      </form>
    </section>
  );
}

export default AdminProfileSettings;
