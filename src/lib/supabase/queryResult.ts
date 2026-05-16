export interface SupabaseResult<T> {
  data: T | null;
  error: { message: string } | null;
}

function throwSupabaseFallback(
  error: { message: string },
  fallback: string
): never {
  console.error("Supabase request failed", error.message);
  throw new Error(fallback);
}

export function requireSupabaseResult<T>(
  result: SupabaseResult<T>,
  fallback: string
): T | null {
  if (result.error) {
    throwSupabaseFallback(result.error, fallback);
  }
  return result.data;
}

export function requireSupabaseData<T>(
  result: SupabaseResult<T>,
  fallback: string
): T {
  const data = requireSupabaseResult(result, fallback);
  if (data === null) {
    throw new Error(fallback);
  }
  return data;
}
