import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function flattenKeys(input: unknown, prefix = "", result: string[] = []): string[] {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return result;
  }

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenKeys(value, nextKey, result);
    } else {
      result.push(nextKey);
    }
  }

  return result;
}

describe("i18n locale coverage", () => {
  it("keeps all locale keysets aligned with english", () => {
    const localesRoot = path.resolve(process.cwd(), "public/locales");
    const englishPath = path.join(localesRoot, "en", "translation.json");
    const english = JSON.parse(fs.readFileSync(englishPath, "utf8"));
    const englishKeys = flattenKeys(english).sort();

    const localeDirs = fs.readdirSync(localesRoot).filter((locale) => locale !== "en");
    for (const locale of localeDirs) {
      const localeFile = path.join(localesRoot, locale, "translation.json");
      const localeJson = JSON.parse(fs.readFileSync(localeFile, "utf8"));
      const localeKeys = new Set(flattenKeys(localeJson));
      const missing = englishKeys.filter((key) => !localeKeys.has(key));
      expect(missing, `Locale "${locale}" is missing keys`).toEqual([]);
    }
  });
});
