import { signInWithGoogle } from "@/app/auth/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function LoginPage() {
  const isConfigured = hasSupabaseEnv();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">
          Use the Google account connected to this custody calendar.
        </p>
        <form action={signInWithGoogle} className="mt-6">
          <button
            type="submit"
            disabled={!isConfigured}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue with Google
          </button>
        </form>
        {!isConfigured && (
          <p className="mt-4 text-sm text-red-700">
            Supabase environment variables are not configured.
          </p>
        )}
      </div>
    </main>
  );
}
