import { OAuth2Client } from "google-auth-library";
import { ApiError } from "./ApiError.js";

//one client for the process: it caches Google's public signing keys between requests.
//Exported so the Google smoke test can point it at its own keys (no network, no real Google account needed).
export const googleClient = new OAuth2Client();

//header.payload.signature, all base64url; anything else can't be a Google ID token, so don't bother Google
const LOOKS_LIKE_JWT = /^[\w-]+\.[\w-]+\.[\w-]+$/;

//Checks the ID token that the "Sign in with Google" button hands the browser: signature, expiry, issuer, and that it
//was issued for THIS app (audience = our client ID). Returns { sub, email, email_verified, name } or throws an ApiError.
export async function verifyGoogleCredential(credential) {
  if (!LOOKS_LIKE_JWT.test(credential)) throw new ApiError(401, "That Google sign-in couldn't be verified.");

  const audience = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!audience) throw new ApiError(503, "Google sign-in isn't set up.");

  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience });
    return ticket.getPayload();
  } catch {
    throw new ApiError(401, "That Google sign-in couldn't be verified.");
  }
}
