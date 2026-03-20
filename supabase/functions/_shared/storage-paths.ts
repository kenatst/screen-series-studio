/**
 * Shared storage path builders for organized folder structure.
 *
 * NEW layout:
 *   {userId}/{projectId}/{sizeSlug}/{langCode}/slide-{n}.png
 *
 * Examples:
 *   user-abc/proj-123/6-5/en/slide-1.png      (6.5" English original)
 *   user-abc/proj-123/6-9/en/slide-1.png      (6.9" resized)
 *   user-abc/proj-123/12-9/en/slide-1.png     (iPad resized)
 *   user-abc/proj-123/6-5/fr/slide-1.png      (6.5" French translation)
 *   user-abc/proj-123/6-9/es/slide-1.png      (6.9" Spanish translation)
 */

export const SIZE_SLUG: Record<string, string> = {
  "iphone-6-5": "6-5",
  "iphone-6-9": "6-9",
  "ipad-12-9": "12-9",
};

const LANG_CODES: Record<string, string> = {
  English: "en",
  French: "fr",
  Spanish: "es",
  German: "de",
  Japanese: "ja",
  Portuguese: "pt",
  Chinese: "zh",
  Korean: "ko",
  Italian: "it",
  Arabic: "ar",
  Russian: "ru",
  Turkish: "tr",
  Hindi: "hi",
};

/** Convert a language name to a short slug (e.g. "French" → "fr"). */
export function langSlug(language: string): string {
  return (
    LANG_CODES[language] ||
    language
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .slice(0, 2)
  );
}

/** Build a storage path for a slide image. */
export function slidePath(
  userId: string,
  projectId: string,
  slideNumber: number,
  format = "iphone-6-5",
  language = "en",
): string {
  const size = SIZE_SLUG[format] || "6-5";
  const lang = LANG_CODES[language] || language;
  return `${userId}/${projectId}/${size}/${lang}/slide-${slideNumber}.png`;
}
