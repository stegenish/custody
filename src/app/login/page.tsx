import type { Metadata } from "next";
import { signInWithGoogle } from "@/app/auth/actions";
import { sanitizeNextPath } from "@/lib/auth/redirects";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  referrer: "no-referrer",
};

interface LoginPageProps {
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
  }>;
}

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isConfigured = hasSupabaseEnv();
  const nextPath = sanitizeNextPath(firstSearchParam(params.next));
  const error = firstSearchParam(params.error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">
          Use the Google account connected to this custody calendar.
        </p>
        <form action={signInWithGoogle} className="mt-6">
          <input type="hidden" name="next" value={nextPath} />
          <button
            type="submit"
            disabled={!isConfigured}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue with Google
          </button>
        </form>
        {error && (
          <p className="mt-4 text-sm text-red-700">
            Sign-in failed. Please try again.
          </p>
        )}
        {!isConfigured && (
          <p className="mt-4 text-sm text-red-700">
            Supabase environment variables are not configured.
          </p>
        )}
      </div>
    </main>
  );
}
