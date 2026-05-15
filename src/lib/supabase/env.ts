const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function hasSupabaseEnv(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export function getSupabaseEnv(): {
  url: string;
  publishableKey: string;
} {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }

  return {
    url: SUPABASE_URL,
    publishableKey: SUPABASE_PUBLISHABLE_KEY,
  };
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
