import { describe, it, expect } from 'vitest';
import { isPasswordCompliant, PASSWORD_MIN_LENGTH, PASSWORD_RULE_TEXT } from './passwordRules';

/**
 * Frontend half of the password contract. Vectors are IDENTICAL to
 * backend tests/Unit/Validation/PasswordRulesTest.php - if either side
 * changes, change both, or users submit passwords the other rejects.
 */
const COMPLIANT = ['Str0ng!Passw0rd', 'Abcdef123!@#', 'Xy9!Xy9!Xy9!', 'aB3$56789012'];
const WEAK = [
  '',
  'short1!A',
  'alllowercase123!',
  'ALLUPPERCASE123!',
  'NoDigitsHere!!',
  'NoSymbols123Aa',
  'Ab1!Ab1!Ab1',
];

describe('passwordRules - backend parity', () => {
  it('accepts compliant passwords', () => {
    for (const pw of COMPLIANT) expect(isPasswordCompliant(pw)).toBe(true);
  });

  it('rejects weak passwords', () => {
    for (const pw of WEAK) expect(isPasswordCompliant(pw)).toBe(false);
  });

  it('publishes the floor and the message', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(12);
    expect(PASSWORD_RULE_TEXT).toMatch(/12/);
  });
});
