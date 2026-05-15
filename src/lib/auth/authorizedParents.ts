export const INITIAL_PARENT_EMAIL = "thomas.stegen@gmail.com";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isInitialParentEmail(email: string | null | undefined): boolean {
  return email ? normalizeEmail(email) === INITIAL_PARENT_EMAIL : false;
}
