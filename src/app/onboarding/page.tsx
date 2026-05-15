import { createInitialGroup } from "./actions";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">
          Create custody group
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          The initial group can be created by the configured first parent.
        </p>
        <form action={createInitialGroup} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Create group
          </button>
        </form>
      </div>
    </main>
  );
}
