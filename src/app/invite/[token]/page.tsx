import type { Metadata } from "next";
import { signInWithGoogle } from "@/app/auth/actions";
import { acceptInvite } from "@/app/invite/actions";

export const metadata: Metadata = {
  referrer: "no-referrer",
};

interface InvitePageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InvitePage({
  params,
  searchParams,
}: InvitePageProps) {
  const { token } = await params;
  const error = firstSearchParam((await searchParams).error);
  const accept = acceptInvite.bind(null, token);
  const nextPath = `/invite/${encodeURIComponent(token)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">
          Join custody calendar
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in with Google first if needed, then accept this private invite.
        </p>
        {error === "invalid-invite" && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            This invite link is invalid, expired, already used, or the custody
            group is already full.
          </p>
        )}
        <form action={signInWithGoogle} className="mt-6">
          <input type="hidden" name="next" value={nextPath} />
          <button
            type="submit"
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Continue with Google
          </button>
        </form>
        <form action={accept} className="mt-3">
          <button
            type="submit"
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Accept invite
          </button>
        </form>
      </div>
    </main>
  );
}
