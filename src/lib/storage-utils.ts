/**
 * Shared storage and format utilities used across the app.
 */

/** Checks if a string is a storage path (not a full URL) */
export function isStoragePath(value: string | null): boolean {
import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60 * 2;

export function isStoragePath(value: string | null | undefined): boolean {
  if (!value) return false;
  return !value.startsWith("http://") && !value.startsWith("https://");
}

/** Language labels with native names */
export const LANGUAGE_LABELS: Record<string, string> = {
  French: 'French (Français)',
  Spanish: 'Spanish (Español)',
  German: 'German (Deutsch)',
  Japanese: 'Japanese (日本語)',
  Portuguese: 'Portuguese (Português)',
  Chinese: 'Chinese (中文)',
  Korean: 'Korean (한국어)',
  Italian: 'Italian (Italiano)',
  Arabic: 'Arabic (العربية)',
  Russian: 'Russian (Русский)',
  Turkish: 'Turkish (Türkçe)',
  Hindi: 'Hindi (हिन्दी)',
};

/** Format display labels */
export const FORMAT_LABELS: Record<string, { label: string; shortLabel: string }> = {
  'iphone-6-5': { label: '6.5" iPhone', shortLabel: '6.5"' },
  'iphone-6-9': { label: '6.9" iPhone', shortLabel: '6.9"' },
  'ipad-12-9': { label: '12.9" iPad', shortLabel: '12.9" iPad' },
};
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
