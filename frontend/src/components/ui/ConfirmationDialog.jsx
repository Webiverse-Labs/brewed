import { useEffect, useId, useRef, useState } from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import TextInput from "./TextInput.jsx";
import Field from "./Field.jsx";
import { errorMessage } from "../../lib/api.js";

// The provider mounts a fresh instance for each request, so input and errors never carry over.
function ConfirmationDialog({ title, description, confirmLabel = "Confirm", pendingLabel = "Please wait…", danger = false, verificationText, checkboxLabel, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verification, setVerification] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const running = useRef(false);
  const cancelRef = useRef(null);
  const descriptionId = useId();
  const checkboxId = useId();
  const ready = (!verificationText || verification.trim() === verificationText) && (!checkboxLabel || acknowledged);

  useEffect(() => { cancelRef.current?.focus(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!ready || running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  return (
    <Modal open title={title} onClose={onCancel} busy={busy} role="alertdialog" describedBy={descriptionId} size="sm">
      <div id={descriptionId} className="text-[15px] leading-relaxed break-words text-secondary">{description}</div>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-5">
        {checkboxLabel && (
          <div className="flex items-start gap-3">
            <input
              id={checkboxId}
              type="checkbox"
              required
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              disabled={busy}
              className="checkbox checkbox-primary mt-0.5 size-4 shrink-0 rounded-sm"
            />
            <label htmlFor={checkboxId} className="text-sm leading-relaxed text-secondary">{checkboxLabel}</label>
          </div>
        )}
        {verificationText && (
          <Field label={`Type ${verificationText} to confirm`}>
            <TextInput
              value={verification}
              onChange={(event) => setVerification(event.target.value)}
              required
              disabled={busy}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
        )}
        {error && <p role="alert" className="rounded-field border border-error/20 bg-error/5 p-3 text-sm text-error">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="outline" disabled={busy} onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant={danger ? "danger" : "primary"} disabled={busy || !ready}>
            {busy ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ConfirmationDialog;
