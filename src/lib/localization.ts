export const LANGUAGE_OPTIONS = [
  { value: "French", label: "French (Francais)" },
  { value: "Spanish", label: "Spanish (Espanol)" },
  { value: "German", label: "German (Deutsch)" },
  { value: "Japanese", label: "Japanese (日本語)" },
  { value: "Portuguese", label: "Portuguese (Portugues)" },
  { value: "Chinese", label: "Chinese (中文)" },
  { value: "Korean", label: "Korean (한국어)" },
  { value: "Italian", label: "Italian (Italiano)" },
  { value: "Arabic", label: "Arabic (العربية)" },
  { value: "Russian", label: "Russian (Русский)" },
  { value: "Turkish", label: "Turkish (Turkce)" },
  { value: "Hindi", label: "Hindi (हिन्दी)" },
] as const;

export const LANGUAGE_LABELS: Record<string, string> = Object.fromEntries(
  LANGUAGE_OPTIONS.map((lang) => [lang.value, lang.label]),
);

export const DEVICE_FORMAT_LABELS: Record<string, string> = {
  "iphone-6-5": '6.5" iPhone',
  "iphone-6-9": '6.9" iPhone',
  "ipad-12-9": '12.9" iPad',
};

export const FORMAT_SUFFIX: Record<string, string> = {
  "iphone-6-5": "6-5",
  "iphone-6-9": "6-9",
  "ipad-12-9": "ipad",
};
