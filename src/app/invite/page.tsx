import { acceptPendingInvite } from "@/app/invite/actions";
import { firstSearchParam } from "@/lib/searchParams";
import { getPendingInviteToken } from "@/lib/auth/pendingInvite";

interface PendingInvitePageProps {
  searchParams?: Promise<{ error?: string | string[] }>;
}

export default async function PendingInvitePage({
  searchParams = Promise.resolve({}),
}: PendingInvitePageProps) {
  const hasPendingInvite = Boolean(await getPendingInviteToken());
  const error = firstSearchParam((await searchParams).error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">
          Join custody calendar
        </h1>
        {error === "invalid-invite" && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            This invite link is invalid, expired, already used, or the custody
            group is already full.
          </p>
        )}
        {hasPendingInvite ? (
          <form action={acceptPendingInvite} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Accept invite
            </button>
          </form>
        ) : (
          <p role="alert" className="mt-4 text-sm text-red-700">
            No pending invite was found. Open the private invite link again.
          </p>
        )}
      </div>
    </main>
  );
}
