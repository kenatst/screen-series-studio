import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60 * 2;

export function isStoragePath(value: string | null | undefined): boolean {
  if (!value) return false;
  return !value.startsWith("http://") && !value.startsWith("https://");
}

export async function resolveSignedUrl(
  bucket: string,
  path: string | null | undefined,
  ttlSeconds = DEFAULT_SIGNED_URL_TTL_SECONDS,
): Promise<string | null> {
  if (!path) return null;
  if (!isStoragePath(path)) return path;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ttlSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
