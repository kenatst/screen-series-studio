import { describe, expect, it } from "vitest";
import { LANGUAGE_LABELS, LANGUAGE_OPTIONS } from "@/lib/localization";
import {
  normalizeUiLanguage,
  OUTPUT_LANGUAGE_CODES,
  UI_LANGUAGE_OPTIONS,
} from "@/lib/ui-languages";

describe("LANGUAGE_OPTIONS (output/translation languages)", () => {
  it("defines 12 output languages", () => {
    expect(LANGUAGE_OPTIONS).toHaveLength(12);
  });

  it("includes all major App Store languages", () => {
    const values = LANGUAGE_OPTIONS.map((l) => l.value);
    expect(values).toContain("French");
    expect(values).toContain("Spanish");
    expect(values).toContain("German");
    expect(values).toContain("Japanese");
    expect(values).toContain("Portuguese");
    expect(values).toContain("Chinese");
    expect(values).toContain("Korean");
    expect(values).toContain("Italian");
    expect(values).toContain("Arabic");
    expect(values).toContain("Russian");
    expect(values).toContain("Turkish");
    expect(values).toContain("Hindi");
  });

  it("every option has a display label containing native script", () => {
    LANGUAGE_OPTIONS.forEach((lang) => {
      expect(lang.label, `${lang.value} should have a label`).toBeTruthy();
      expect(lang.label.length, `${lang.value} label too short`).toBeGreaterThan(3);
    });
  });

  it("every option has unique value", () => {
    const values = LANGUAGE_OPTIONS.map((l) => l.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("LANGUAGE_LABELS", () => {
  it("maps all LANGUAGE_OPTIONS values to labels", () => {
    LANGUAGE_OPTIONS.forEach((lang) => {
      expect(LANGUAGE_LABELS[lang.value], `Missing label for ${lang.value}`).toBe(lang.label);
    });
  });
});

describe("UI_LANGUAGE_OPTIONS", () => {
  it("defines 9 UI languages", () => {
    expect(UI_LANGUAGE_OPTIONS).toHaveLength(9);
  });

  it("includes all supported UI languages with flags", () => {
    const codes = UI_LANGUAGE_OPTIONS.map((l) => l.code);
    expect(codes).toEqual(["en", "fr", "de", "es", "zh", "ja", "hi", "tr", "ar"]);
  });

  it("every UI language has a flag emoji", () => {
    UI_LANGUAGE_OPTIONS.forEach((lang) => {
      expect(lang.flag, `${lang.code} should have a flag`).toBeTruthy();
    });
  });

  it("every UI language has a native label", () => {
    UI_LANGUAGE_OPTIONS.forEach((lang) => {
      expect(lang.label, `${lang.code} should have a label`).toBeTruthy();
    });
  });
});

describe("OUTPUT_LANGUAGE_CODES", () => {
  it("defines 10 output language codes", () => {
    expect(OUTPUT_LANGUAGE_CODES).toHaveLength(10);
  });

  it("includes all expected codes", () => {
    expect(OUTPUT_LANGUAGE_CODES).toEqual(["en", "fr", "de", "es", "it", "pt", "ja", "ko", "zh", "ar"]);
  });
});

describe("normalizeUiLanguage", () => {
  it("returns valid UI language codes unchanged", () => {
    expect(normalizeUiLanguage("en")).toBe("en");
    expect(normalizeUiLanguage("fr")).toBe("fr");
    expect(normalizeUiLanguage("de")).toBe("de");
    expect(normalizeUiLanguage("es")).toBe("es");
    expect(normalizeUiLanguage("zh")).toBe("zh");
    expect(normalizeUiLanguage("ja")).toBe("ja");
    expect(normalizeUiLanguage("hi")).toBe("hi");
    expect(normalizeUiLanguage("tr")).toBe("tr");
    expect(normalizeUiLanguage("ar")).toBe("ar");
  });

  it("handles locale codes with region (e.g. fr-FR)", () => {
    expect(normalizeUiLanguage("fr-FR")).toBe("fr");
    expect(normalizeUiLanguage("de-DE")).toBe("de");
    expect(normalizeUiLanguage("zh-CN")).toBe("zh");
    expect(normalizeUiLanguage("en-US")).toBe("en");
  });

  it("handles case-insensitive input", () => {
    expect(normalizeUiLanguage("FR")).toBe("fr");
    expect(normalizeUiLanguage("EN")).toBe("en");
    expect(normalizeUiLanguage("JA")).toBe("ja");
  });

  it("defaults to en for unknown languages", () => {
    expect(normalizeUiLanguage("xx")).toBe("en");
    expect(normalizeUiLanguage("ko")).toBe("en");
    expect(normalizeUiLanguage("pt")).toBe("en");
  });

  it("defaults to en for null/undefined/empty", () => {
    expect(normalizeUiLanguage(null)).toBe("en");
    expect(normalizeUiLanguage(undefined)).toBe("en");
    expect(normalizeUiLanguage("")).toBe("en");
  });
});
