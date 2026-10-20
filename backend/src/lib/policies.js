import { ApiError } from "./ApiError.js";

// Matches the effective date displayed on /terms and /privacy. Only the server sets the acceptance date/version.
export const POLICY_VERSION = "2026-10-20";

export function policyAcceptance(acceptedPolicies) {
  if (acceptedPolicies !== true) {
    throw new ApiError(
      400,
      "Agree to the Terms and Conditions and acknowledge the Privacy Policy before creating an account.",
      "POLICY_ACCEPTANCE_REQUIRED",
    );
  }
  return { policyVersion: POLICY_VERSION, policiesAcceptedAt: new Date() };
}
