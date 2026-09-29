import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Avatar from "../ui/Avatar.jsx";
import Field from "../ui/Field.jsx";
import TextInput from "../ui/TextInput.jsx";
import TextArea from "../ui/TextArea.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";
import Button from "../ui/Button.jsx";
import { currentUser } from "../../data/mock.js";

function ProfileSettingsForm() {
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Revoke the previous preview when it's replaced, and the last one on unmount.
  useEffect(() => () => avatarUrl && URL.revokeObjectURL(avatarUrl), [avatarUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO(api): PATCH /api/users/me, POST /api/users/me/avatar
    toast.success("Profile saved.");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <SectionLabel>Profile Information</SectionLabel>

      <div className="flex items-center gap-4">
        <Avatar name={currentUser.name} tone={currentUser.tone} size="lg" src={avatarUrl} />
        <label className="inline-flex h-8 cursor-pointer items-center rounded-full border border-base-300 bg-surface px-3.5 text-sm font-medium hover:bg-base-200 focus-within:outline-2 focus-within:outline-accent">
          Change Avatar
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setAvatarUrl(URL.createObjectURL(file));
            }}
          />
        </label>
      </div>

      <Field label="Username">
        <TextInput name="username" required defaultValue={currentUser.username} autoComplete="username" />
      </Field>
      <Field label="Display Name">
        <TextInput name="name" required defaultValue={currentUser.name} autoComplete="name" />
      </Field>
      <Field label="Bio">
        <TextArea name="bio" defaultValue={currentUser.bio} />
      </Field>

      <Button type="submit" className="self-start">
        Save Changes
      </Button>
    </form>
  );
}

export default ProfileSettingsForm;
