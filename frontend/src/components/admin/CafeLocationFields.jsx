import { useState } from "react";
import Field from "../ui/Field.jsx";
import TextInput from "../ui/TextInput.jsx";

function CafeLocationFields({ location }) {
  const [latitude, setLatitude] = useState(String(location?.lat ?? ""));
  const [longitude, setLongitude] = useState(String(location?.lng ?? ""));
  return (
    <fieldset className="rounded-2xl border border-base-300 p-4">
      <legend className="px-1 text-sm font-medium">Map pin</legend>
      <p className="mb-3 text-xs text-secondary">Add both coordinates to show this café in Explore. Leave both blank to remove its pin.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Latitude">
          <TextInput name="latitude" type="number" step="any" min="-90" max="90" placeholder="e.g. 14.7504" value={latitude} onChange={(event) => setLatitude(event.target.value)} required={longitude !== ""} />
        </Field>
        <Field label="Longitude">
          <TextInput name="longitude" type="number" step="any" min="-180" max="180" placeholder="e.g. 121.0196" value={longitude} onChange={(event) => setLongitude(event.target.value)} required={latitude !== ""} />
        </Field>
      </div>
    </fieldset>
  );
}

export default CafeLocationFields;
