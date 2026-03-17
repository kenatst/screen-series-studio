/**
 * Shared storage and format utilities used across the app.
 */

/** Checks if a string is a storage path (not a full URL) */
export function isStoragePath(value: string | null): boolean {
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
