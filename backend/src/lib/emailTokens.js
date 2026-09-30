import { createHash, randomBytes } from "node:crypto";

//the raw token goes in the emailed link; only its hash is stored, so a leaked database can't be used to verify or reset
export const hashToken = (raw) => createHash("sha256").update(String(raw)).digest("hex");

export function createToken() {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}
