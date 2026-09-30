import { useState } from "react";
import toast from "react-hot-toast";
import Avatar from "../ui/Avatar.jsx";
import Field from "../ui/Field.jsx";
import TextInput from "../ui/TextInput.jsx";
import TextArea from "../ui/TextArea.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";
import Button from "../ui/Button.jsx";
import api, { errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";

function ProfileSettingsForm() {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  //the avatar saves as soon as a file is picked
  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const form = new FormData();
    form.set("avatar", file);
    setUploading(true);
    try {
      const { data } = await api.post("/users/me/avatar", form);
      setUser(data.user);
      toast.success("Avatar updated.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    setSaving(true);
    try {
      const { data } = await api.patch("/users/me", fields);
      setUser(data.user);
      toast.success("Profile saved.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <SectionLabel>Profile Information</SectionLabel>

      <div className="flex items-center gap-4">
        <Avatar name={user.name} src={user.avatarUrl} size="lg" />
        <label className="inline-flex h-8 cursor-pointer items-center rounded-full border border-base-300 bg-surface px-3.5 text-sm font-medium hover:bg-base-200 focus-within:outline-2 focus-within:outline-accent">
          {uploading ? "Uploading…" : "Change Avatar"}
          <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={handleAvatar} />
        </label>
      </div>

      <Field label="Username" hint="3–30 characters: letters, numbers, _ or .">
        <TextInput name="username" required defaultValue={user.username} autoComplete="username" />
      </Field>
      <Field label="Display Name">
        <TextInput name="name" required defaultValue={user.name} autoComplete="name" />
      </Field>
      <Field label="Bio">
        <TextArea name="bio" maxLength={200} defaultValue={user.bio} />
      </Field>

      <Button type="submit" className="self-start" disabled={saving}>
        {saving ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}

export default ProfileSettingsForm;
