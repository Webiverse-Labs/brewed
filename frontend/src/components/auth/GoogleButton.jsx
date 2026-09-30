import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let scriptPromise;
// loads Google's sign-in script once for the whole app; a failed load can be retried by the next mount
function loadGoogle() {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      // a blocker or a partial load can leave the global missing: fail (and allow a retry) instead of caching a dud
      if (window.google?.accounts?.id) return resolve(window.google);
      scriptPromise = undefined;
      script.remove();
      reject(new Error("Google sign-in didn't initialize."));
    };
    script.onerror = () => {
      scriptPromise = undefined;
      script.remove();
      reject(new Error("Couldn't load Google sign-in."));
    };
    document.head.append(script);
  });
  return scriptPromise;
}

// google.accounts.id.initialize() should run once (it warns when repeated) and its callback is fixed at that point,
// so it calls whichever button is currently mounted
let initialized = false;
let activeHandler;

// "Sign in with Google" button. `onCredential(idToken)` gets the signed ID token, which the backend verifies.
// Renders nothing when VITE_GOOGLE_CLIENT_ID isn't set, so the app still works without Google configured.
function GoogleButton({ text = "signin_with", onCredential }) {
  const box = useRef(null);
  const handlerRef = useRef(onCredential);

  useEffect(() => {
    handlerRef.current = onCredential;
  });

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadGoogle()
      .then((google) => {
        if (cancelled || !box.current) return;
        if (!initialized) {
          google.accounts.id.initialize({ client_id: CLIENT_ID, callback: (res) => activeHandler?.(res.credential) });
          initialized = true;
        }
        activeHandler = (credential) => handlerRef.current(credential);
        box.current.replaceChildren();
        google.accounts.id.renderButton(box.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text,
          logo_alignment: "center",
          width: Math.min(400, Math.max(200, box.current.offsetWidth)), // Google only accepts 200–400 px
        });
      })
      .catch(() => {}); // blocked or offline: the email form still works
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!CLIENT_ID) return null;
  return <div ref={box} className="flex min-h-11 w-full justify-center" />;
}

export default GoogleButton;
