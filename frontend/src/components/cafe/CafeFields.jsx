import Field from "../ui/Field.jsx";
import TextInput from "../ui/TextInput.jsx";
import TextArea from "../ui/TextArea.jsx";

// Fields shared by the user "Suggest a Café" form and the admin "Add Café" form.
function CafeFields({ defaults = {} }) {
  return (
    <>
      <Field label="Café Name" required>
        <TextInput name="name" required placeholder="e.g. Elm & Oak Brew" defaultValue={defaults.name} />
      </Field>
      <Field label="Address / Location" required>
        <TextInput
          name="address"
          required
          placeholder="123 Example St, City, Country"
          defaultValue={defaults.address}
        />
      </Field>
      <Field label="Opening Hours">
        <TextInput name="hours" placeholder="e.g. Mon–Fri 8am–6pm" defaultValue={defaults.hours} />
      </Field>
      <Field label="Description">
        <TextArea name="description" rows={2} placeholder="Tell us about this café…" defaultValue={defaults.description} />
      </Field>
    </>
  );
}

export default CafeFields;
