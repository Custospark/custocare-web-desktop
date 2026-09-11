/**
 * Shared password contract - mirrors backend App\Validation\PasswordRules
 * (min 12, letters, mixed case, numbers, symbols).
 *
 * Both sides enforce the identical rule so users can never submit a password
 * on the frontend that the backend would reject with a 422. If either side
 * changes, change this file AND PasswordRules::create() together.
 */
export const PASSWORD_MIN_LENGTH = 12;

export const PASSWORD_RULE_TEXT =
  'Minimum 12 characters with upper and lower case letters, a number and a symbol.';

export function isPasswordCompliant(password: string): boolean {
  if (!password || password.length < PASSWORD_MIN_LENGTH) return false;
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[^a-zA-Z0-9]/.test(password)) return false;
  return true;
}
