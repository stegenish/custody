// Initial-parent enforcement currently happens through Supabase onboarding/RLS.
export const DEFAULT_INITIAL_PARENT_EMAIL = "thomas.stegen@gmail.com";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getInitialParentEmail(): string {
  return normalizeEmail(
    process.env.INITIAL_PARENT_EMAIL ?? DEFAULT_INITIAL_PARENT_EMAIL
  );
}

export function isInitialParentEmail(email: string | null | undefined): boolean {
  return email ? normalizeEmail(email) === getInitialParentEmail() : false;
}
