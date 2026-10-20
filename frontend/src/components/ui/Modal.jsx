import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn.js";

const widths = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
};

// DaisyUI modal on a native <dialog>: Esc, backdrop click and focus trapping come from the browser.
// Children only mount while open, so forms inside reset every time the modal opens.
function Modal({ open, onClose, title, size = "md", busy = false, role = "dialog", describedBy, children }) {
  const ref = useRef(null);
  const titleId = useId(); //gives the dialog an accessible name: screen readers announce the title on open

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      role={role}
      aria-labelledby={titleId}
      aria-modal={open || undefined}
      aria-describedby={describedBy}
      aria-busy={busy || undefined}
      className="modal modal-bottom outline-none sm:modal-middle"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClose={() => {
        // A queued close event from an earlier opening must not dismiss a newly opened dialog.
        if (open && !ref.current?.open && !busy) onClose();
      }}
    >
      <div
        className={cn(
          "modal-box max-h-[90vh] rounded-t-3xl bg-base-100 p-6 shadow-float outline-none sm:rounded-3xl",
          widths[size],
        )}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id={titleId} className="font-display text-xl font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-full text-secondary hover:bg-base-200"
          >
            <X size={18} />
          </button>
        </div>
        {open && children}
      </div>
      <form
        method="dialog"
        className="modal-backdrop"
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) onClose();
        }}
      >
        <button type="submit" disabled={busy} aria-label="Close dialog">close</button>
      </form>
    </dialog>
  );
}

export default Modal;
