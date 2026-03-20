import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type TranslationFile = {
  faq?: { items?: unknown[] };
  landing?: {
    workflow?: { steps?: unknown[] };
    gallery?: { items?: unknown[] };
    batchGeneration?: { slideLabels?: unknown[] };
    featureShowcase?: {
      planner?: { slides?: unknown[] };
    };
  };
};

describe("landing i18n structure", () => {
  it("keeps structured landing arrays complete in every locale", () => {
    const localesRoot = path.resolve(process.cwd(), "public/locales");
    const localeDirs = fs.readdirSync(localesRoot);

    for (const locale of localeDirs) {
      const localeFile = path.join(localesRoot, locale, "translation.json");
      const content = JSON.parse(fs.readFileSync(localeFile, "utf8")) as TranslationFile;

      expect(content.faq?.items?.length, `${locale}: faq.items`).toBe(10);
      expect(content.landing?.workflow?.steps?.length, `${locale}: landing.workflow.steps`).toBe(6);
      expect(content.landing?.gallery?.items?.length, `${locale}: landing.gallery.items`).toBe(27);
      expect(content.landing?.batchGeneration?.slideLabels?.length, `${locale}: landing.batchGeneration.slideLabels`).toBe(10);
      expect(content.landing?.featureShowcase?.planner?.slides?.length, `${locale}: landing.featureShowcase.planner.slides`).toBe(2);
    }
  });
});
