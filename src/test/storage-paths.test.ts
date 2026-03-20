import { describe, expect, it } from "vitest";
import { langSlug, SIZE_SLUG, slidePath } from "../../supabase/functions/_shared/storage-paths";

describe("SIZE_SLUG (storage-paths)", () => {
  it("maps all device formats to folder slugs", () => {
    expect(SIZE_SLUG["iphone-6-5"]).toBe("6-5");
    expect(SIZE_SLUG["iphone-6-9"]).toBe("6-9");
    expect(SIZE_SLUG["ipad-12-9"]).toBe("12-9");
  });
});

describe("langSlug", () => {
  it("maps known language names to 2-char codes", () => {
    expect(langSlug("English")).toBe("en");
    expect(langSlug("French")).toBe("fr");
    expect(langSlug("Spanish")).toBe("es");
    expect(langSlug("German")).toBe("de");
    expect(langSlug("Japanese")).toBe("ja");
    expect(langSlug("Portuguese")).toBe("pt");
    expect(langSlug("Chinese")).toBe("zh");
    expect(langSlug("Korean")).toBe("ko");
    expect(langSlug("Italian")).toBe("it");
    expect(langSlug("Arabic")).toBe("ar");
    expect(langSlug("Russian")).toBe("ru");
    expect(langSlug("Turkish")).toBe("tr");
    expect(langSlug("Hindi")).toBe("hi");
  });

  it("falls back to first 2 lowercase alpha chars for unknown languages", () => {
    expect(langSlug("Swahili")).toBe("sw");
    expect(langSlug("Thai")).toBe("th");
  });
});

describe("slidePath", () => {
  it("builds correct path for default format and language", () => {
    expect(slidePath("user-abc", "proj-123", 1)).toBe("user-abc/proj-123/6-5/en/slide-1.png");
  });

  it("builds correct path for iPhone 6.9\" English", () => {
    expect(slidePath("user-abc", "proj-123", 2, "iphone-6-9", "English")).toBe(
      "user-abc/proj-123/6-9/en/slide-2.png",
    );
  });

  it("builds correct path for iPad 12.9\" French", () => {
    expect(slidePath("user-abc", "proj-123", 3, "ipad-12-9", "French")).toBe(
      "user-abc/proj-123/12-9/fr/slide-3.png",
    );
  });

  it("builds correct path for all supported formats", () => {
    expect(slidePath("u", "p", 1, "iphone-6-5", "en")).toContain("/6-5/");
    expect(slidePath("u", "p", 1, "iphone-6-9", "en")).toContain("/6-9/");
    expect(slidePath("u", "p", 1, "ipad-12-9", "en")).toContain("/12-9/");
  });

  it("builds correct path for all supported languages", () => {
    const languageTests: [string, string][] = [
      ["English", "en"],
      ["French", "fr"],
      ["Spanish", "es"],
      ["German", "de"],
      ["Japanese", "ja"],
      ["Portuguese", "pt"],
      ["Chinese", "zh"],
      ["Korean", "ko"],
      ["Italian", "it"],
      ["Arabic", "ar"],
      ["Russian", "ru"],
      ["Turkish", "tr"],
      ["Hindi", "hi"],
    ];

    for (const [langName, langCode] of languageTests) {
      const path = slidePath("u", "p", 1, "iphone-6-5", langName);
      expect(path, `Language ${langName}`).toBe(`u/p/6-5/${langCode}/slide-1.png`);
    }
  });

  it("handles short language codes passed directly", () => {
    expect(slidePath("u", "p", 1, "iphone-6-5", "fr")).toBe("u/p/6-5/fr/slide-1.png");
  });

  it("falls back gracefully for unknown formats", () => {
    const path = slidePath("u", "p", 1, "unknown-format", "en");
    expect(path).toBe("u/p/6-5/en/slide-1.png");
  });

  it("uses correct slide numbering", () => {
    for (let i = 1; i <= 10; i++) {
      expect(slidePath("u", "p", i)).toContain(`slide-${i}.png`);
    }
  });
});
