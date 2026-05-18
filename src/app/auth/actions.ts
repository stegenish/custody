"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import { sanitizeNextPath } from "@/lib/auth/redirects";
import { storeInviteTokenFromPath } from "@/lib/auth/pendingInvite";

export async function signInWithGoogle(formData?: FormData) {
  const nextPath = sanitizeNextPath(formData?.get("next")?.toString());
  const oauthNextPath = (await storeInviteTokenFromPath(nextPath))
    ? "/invite"
    : nextPath;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(
        oauthNextPath
      )}`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect("/login?error=missing-oauth-url");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
