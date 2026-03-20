export const UI_LANGUAGE_OPTIONS = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
] as const;

export type UiLanguageCode = (typeof UI_LANGUAGE_OPTIONS)[number]["code"];

const UI_LANGUAGE_CODE_SET = new Set<string>(UI_LANGUAGE_OPTIONS.map((language) => language.code));

export function normalizeUiLanguage(input?: string | null): UiLanguageCode {
  const normalized = (input ?? "").toLowerCase().split("-")[0];
  if (UI_LANGUAGE_CODE_SET.has(normalized)) {
    return normalized as UiLanguageCode;
  }
  return "en";
}

export const OUTPUT_LANGUAGE_CODES = [
  "en",
  "fr",
  "de",
  "es",
  "it",
  "pt",
  "ja",
  "ko",
  "zh",
  "ar",
] as const;

export type OutputLanguageCode = (typeof OUTPUT_LANGUAGE_CODES)[number];
