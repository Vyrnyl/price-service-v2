export const PASSWORD_POLICY_MESSAGE =
  "Password must include an uppercase letter, a lowercase letter, and a number";

export function isPasswordComplex(password: string): boolean {
  return /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password);
}
