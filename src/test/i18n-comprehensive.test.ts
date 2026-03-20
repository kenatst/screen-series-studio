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

const localesRoot = path.resolve(process.cwd(), "public/locales");
const allLocales = fs.readdirSync(localesRoot);
const englishPath = path.join(localesRoot, "en", "translation.json");
const english = JSON.parse(fs.readFileSync(englishPath, "utf8"));
const englishKeys = flattenKeys(english).sort();

describe("i18n comprehensive validation", () => {
  it("has translation files for all 9 UI languages", () => {
    const expectedLocales = ["en", "fr", "de", "es", "zh", "ja", "hi", "tr", "ar"];
    for (const locale of expectedLocales) {
      const filePath = path.join(localesRoot, locale, "translation.json");
      expect(fs.existsSync(filePath), `Missing translation file for ${locale}`).toBe(true);
    }
  });

  it("english translation has all required top-level sections", () => {
    const requiredSections = [
      "nav",
      "hero",
      "pricing",
      "faq",
      "footer",
      "dashboard",
      "login",
      "settings",
      "generating",
      "results",
      "newProject",
      "templates",
      "common",
      "landing",
    ];

    for (const section of requiredSections) {
      expect(english[section], `Missing section: ${section}`).toBeDefined();
    }
  });

  it("all locales have identical key structure to english", () => {
    for (const locale of allLocales) {
      if (locale === "en") continue;
      const localeFile = path.join(localesRoot, locale, "translation.json");
      const localeJson = JSON.parse(fs.readFileSync(localeFile, "utf8"));
      const localeKeys = new Set(flattenKeys(localeJson));
      const missing = englishKeys.filter((key) => !localeKeys.has(key));
      expect(missing, `Locale "${locale}" is missing keys`).toEqual([]);
    }
  });

  it("FAQ has exactly 10 items in all locales", () => {
    for (const locale of allLocales) {
      const localeFile = path.join(localesRoot, locale, "translation.json");
      const content = JSON.parse(fs.readFileSync(localeFile, "utf8"));
      expect(content.faq?.items?.length, `${locale}: faq.items`).toBe(10);
    }
  });

  it("landing gallery has exactly 27 items in all locales", () => {
    for (const locale of allLocales) {
      const localeFile = path.join(localesRoot, locale, "translation.json");
      const content = JSON.parse(fs.readFileSync(localeFile, "utf8"));
      expect(content.landing?.gallery?.items?.length, `${locale}: landing.gallery.items`).toBe(27);
    }
  });

  it("landing workflow has exactly 6 steps in all locales", () => {
    for (const locale of allLocales) {
      const localeFile = path.join(localesRoot, locale, "translation.json");
      const content = JSON.parse(fs.readFileSync(localeFile, "utf8"));
      expect(content.landing?.workflow?.steps?.length, `${locale}: workflow.steps`).toBe(6);
    }
  });

  it("batch generation has exactly 10 slide labels in all locales", () => {
    for (const locale of allLocales) {
      const localeFile = path.join(localesRoot, locale, "translation.json");
      const content = JSON.parse(fs.readFileSync(localeFile, "utf8"));
      expect(
        content.landing?.batchGeneration?.slideLabels?.length,
        `${locale}: slideLabels`,
      ).toBe(10);
    }
  });

  it("planner feature showcase has exactly 2 slides in all locales", () => {
    for (const locale of allLocales) {
      const localeFile = path.join(localesRoot, locale, "translation.json");
      const content = JSON.parse(fs.readFileSync(localeFile, "utf8"));
      expect(
        content.landing?.featureShowcase?.planner?.slides?.length,
        `${locale}: planner.slides`,
      ).toBe(2);
    }
  });

  it("no translation values are empty strings", () => {
    for (const locale of allLocales) {
      const localeFile = path.join(localesRoot, locale, "translation.json");
      const content = JSON.parse(fs.readFileSync(localeFile, "utf8"));
      const keys = flattenKeys(content);
      const getNestedValue = (obj: Record<string, unknown>, keyPath: string): unknown => {
        return keyPath.split(".").reduce((acc: unknown, key) => {
          if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
          return undefined;
        }, obj);
      };

      for (const key of keys) {
        const value = getNestedValue(content, key);
        if (typeof value === "string") {
          expect(value.trim().length, `${locale}: "${key}" is empty`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("wizard step translations exist for all 7 steps", () => {
    const stepKeys = ["project", "appInfo", "screens", "brandKit", "style", "planner", "review"];
    for (const locale of allLocales) {
      const localeFile = path.join(localesRoot, locale, "translation.json");
      const content = JSON.parse(fs.readFileSync(localeFile, "utf8"));
      for (const stepKey of stepKeys) {
        expect(
          content.newProject?.steps?.[stepKey],
          `${locale}: missing newProject.steps.${stepKey}`,
        ).toBeDefined();
      }
    }
  });

  it("pricing section has plan details for all tiers", () => {
    for (const locale of allLocales) {
      const localeFile = path.join(localesRoot, locale, "translation.json");
      const content = JSON.parse(fs.readFileSync(localeFile, "utf8"));
      expect(content.pricing, `${locale}: missing pricing section`).toBeDefined();
    }
  });
});
