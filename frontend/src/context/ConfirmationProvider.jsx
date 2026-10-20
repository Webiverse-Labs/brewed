import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ConfirmationDialog from "../components/ui/ConfirmationDialog.jsx";
import { ConfirmationContext } from "./confirmationContext.js";

function ConfirmationProvider({ children }) {
  const { key: routeKey } = useLocation();
  const [request, setRequest] = useState(null);
  const pending = useRef(null);
  const nextId = useRef(0);
  const currentRoute = useRef(routeKey);

  const finish = useCallback((id, confirmed) => {
    if (pending.current?.id !== id) return;
    pending.current.resolve(confirmed);
    pending.current = null;
    setRequest(null);
  }, []);

  // A second click cannot replace the target or queue an unseen action.
  const confirm = useCallback((options) => {
    if (pending.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      const entry = { ...options, id: ++nextId.current, routeKey, resolve, running: false };
      pending.current = entry;
      setRequest(entry);
    });
  }, [routeKey]);

  useEffect(() => {
    currentRoute.current = routeKey;
    const entry = pending.current;
    if (entry && entry.routeKey !== routeKey && !entry.running) finish(entry.id, false);
  }, [routeKey, finish]);

  useEffect(() => () => {
    pending.current?.resolve(false);
    pending.current = null;
  }, []);

  const execute = async () => {
    const entry = pending.current;
    if (!entry || entry.running) return;
    entry.running = true;
    try {
      await entry.onConfirm?.();
      finish(entry.id, true);
    } catch (error) {
      entry.running = false;
      if (entry.routeKey !== currentRoute.current) finish(entry.id, false);
      throw error;
    }
  };

  return (
    <ConfirmationContext value={confirm}>
      {children}
      {request && (
        <ConfirmationDialog
          key={request.id}
          {...request}
          onConfirm={execute}
          onCancel={() => {
            if (!pending.current?.running) finish(request.id, false);
          }}
        />
      )}
    </ConfirmationContext>
  );
}

export default ConfirmationProvider;
