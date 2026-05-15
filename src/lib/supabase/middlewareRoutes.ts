export function isProtectedPath(pathname: string): boolean {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

export function getLoginRedirectUrl(requestUrl: URL): URL {
  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set(
    "next",
    `${requestUrl.pathname}${requestUrl.search}`
  );
  return loginUrl;
}
