import { useContext } from "react";
import { ConfirmationContext } from "../context/confirmationContext.js";

export function useConfirmation() {
  const confirm = useContext(ConfirmationContext);
  if (!confirm) throw new Error("useConfirmation requires ConfirmationProvider.");
  return confirm;
}
