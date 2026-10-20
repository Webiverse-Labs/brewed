import { useId } from "react";
import { Link } from "react-router-dom";

function PolicyAgreement({ checked, onChange, inputRef, disabled = false }) {
  const id = useId();

  return (
    <div className="flex items-start gap-3">
      <input
        ref={inputRef}
        id={id}
        name="acceptedPolicies"
        type="checkbox"
        required
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="checkbox checkbox-primary mt-0.5 size-4 shrink-0 rounded-sm"
      />
      <label htmlFor={id} className="text-sm leading-relaxed text-secondary">
        I agree to the{" "}
        <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline underline-offset-2">
          Terms and Conditions
        </Link>{" "}
        and acknowledge the{" "}
        <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline underline-offset-2">
          Privacy Policy
        </Link>.
      </label>
    </div>
  );
}

export default PolicyAgreement;
