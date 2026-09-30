import { OAuth2Client } from "google-auth-library";
import { ApiError } from "./ApiError.js";

//one client for the process: it caches Google's public signing keys between requests.
//Exported so the Google smoke test can point it at its own keys (no network, no real Google account needed).
export const googleClient = new OAuth2Client();

//header.payload.signature, all base64url; anything else can't be a Google ID token, so don't bother Google
const LOOKS_LIKE_JWT = /^[\w-]+\.[\w-]+\.[\w-]+$/;

//Why a token was refused, as a fixed label that is safe to log. google-auth-library puts the whole token, its payload (with
//the user's email) or other caller-supplied text into many of its error messages, and a logged ID token can be replayed
//until it expires. So the message text is only ever matched against these patterns, never printed; anything unrecognized
//is just "other". The error code (ENOTFOUND, ETIMEDOUT…) is added for network failures.
const REASONS = [
  [/^Invalid token signature/, "bad signature"],
  [/^Wrong recipient/, "wrong audience"],
  [/^Token used too late/, "expired"],
  [/^Token used too early/, "issued in the future"],
  [/^Invalid issuer/, "wrong issuer"],
  [/^(Wrong number of segments|Can't parse token|No pem found)/, "malformed token"],
  [/^(No issue time|No expiration time|Expiration time too far)/, "bad time claims"],
];

function safeReason(error) {
  const message = String(error?.message ?? "");
  const label = REASONS.find(([pattern]) => pattern.test(message))?.[1] ?? "other";
  return /^[A-Z][A-Z0-9_]{2,30}$/.test(error?.code) ? `${label} (${error.code})` : label;
}

//Checks the ID token that the "Sign in with Google" button hands the browser: signature, expiry, issuer, and that it
//was issued for THIS app (audience = our client ID). Returns { sub, email, email_verified, name } or throws an ApiError.
export async function verifyGoogleCredential(credential) {
  if (!LOOKS_LIKE_JWT.test(credential)) throw new ApiError(401, "That Google sign-in couldn't be verified.");

  const audience = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!audience) throw new ApiError(503, "Google sign-in isn't set up.");

  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience });
    return ticket.getPayload();
  } catch (error) {
    console.warn("Google ID token rejected:", safeReason(error));
    throw new ApiError(401, "That Google sign-in couldn't be verified.");
  }
}
