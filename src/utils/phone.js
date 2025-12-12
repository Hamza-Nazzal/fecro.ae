// src/utils/phone.js
/**
 * Normalizes a 10-digit local UAE mobile number to E.164 format.
 * 
 * @param {string} localNumber - 10-digit local UAE mobile number (e.g., "0551234567")
 * @returns {string} E.164 formatted phone number (e.g., "+971551234567")
 * @throws {Error} If the number is not exactly 10 digits or doesn't start with "05"
 */
export function normalizePhoneNumber(localNumber) {
  if (!localNumber || typeof localNumber !== "string") {
    throw new Error("Phone number is required");
  }

  // Remove everything except digits (handles spaces, dashes, etc.)
  const digits = localNumber.replace(/\D/g, "");

  // Verify it's exactly 10 digits
  if (!/^\d{10}$/.test(digits)) {
    throw new Error("Phone number must be exactly 10 digits");
  }

  // Verify it starts with 05
  if (!digits.startsWith("05")) {
    throw new Error("UAE mobile numbers must start with 05");
  }

  // Remove leading 0 and prepend +971
  const withoutLeadingZero = digits.substring(1);
  return `+971${withoutLeadingZero}`;
}

