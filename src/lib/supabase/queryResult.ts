export interface SupabaseResult<T> {
  data: T | null;
  error: { message: string } | null;
}

export function requireSupabaseData<T>(
  result: SupabaseResult<T>,
  fallback: string
): T {
  if (result.error) {
    throw new Error(result.error.message);
  }
  if (result.data === null) {
    throw new Error(fallback);
  }
  return result.data;
}
