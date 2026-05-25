/**
 * Phone normalization aligned with signup ({@link SignUp}) and backend
 * MessageService / RegisterRequest hashing.
 */

export const normalizePhoneInput = (raw: string): string => {
  const trimmed = raw.trim();
  return trimmed.replace(/(?!^\+)[^\d]/g, '');
};

/** Local digits only (no dial code). */
export const stripPhoneDigits = (raw: string): string => raw.replace(/\D/g, '');

export const buildFullPhoneNumber = (dialCode: string, localDigits: string): string => {
  const dial = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  const local = stripPhoneDigits(localDigits);
  return local ? `${dial}${local}` : '';
};

export const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** E.164-style: leading + and 10–15 digits total (matches signup intent). */
export const isValidInternationalPhone = (raw: string): boolean => {
  const normalized = normalizePhoneInput(raw);
  if (!normalized.startsWith('+')) return false;
  const digitCount = normalized.replace(/\D/g, '').length;
  return digitCount >= 10 && digitCount <= 15;
};

export const looksLikeEmailInput = (input: string): boolean => {
  const t = input.trim();
  return t.includes('@') && validateEmail(t);
};

export const looksLikePhoneInput = (input: string): boolean => {
  const t = input.trim();
  if (!t || t.includes('@')) return false;
  const normalized = normalizePhoneInput(t);
  const digits = normalized.replace(/\D/g, '').length;
  return /^\+?\d/.test(t) && digits >= 6;
};
