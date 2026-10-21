import { useEffect, useId, useRef } from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";

// Mount only while a reminder is needed; dismissal returns focus to the invalid field.
function ValidationReminder({ message, field, onClose }) {
  const descriptionId = useId();
  const acknowledge = useRef(null);

  useEffect(() => {
    acknowledge.current?.focus();
    return () => {
      if (field?.isConnected) field.focus();
    };
  }, [field]);

  return (
    <Modal open title="Check your details" role="alertdialog" describedBy={descriptionId} size="sm" onClose={onClose}>
      <p id={descriptionId} className="text-[15px] leading-relaxed text-secondary">{message}</p>
      <div className="mt-5 flex justify-end">
        <Button ref={acknowledge} onClick={onClose}>Got it</Button>
      </div>
    </Modal>
  );
}

export default ValidationReminder;
