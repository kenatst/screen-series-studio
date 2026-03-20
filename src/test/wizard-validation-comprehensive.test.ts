import { describe, expect, it } from "vitest";
import { validateWizardStep } from "@/lib/wizard-validation";

describe("validateWizardStep – comprehensive", () => {
  const validInput = {
    step: 1,
    appName: "My Cool App",
    uploadedScreensCount: 3,
    slides: [{ headline: "Headline 1" }, { headline: "Headline 2" }],
  };

  // Step 1: App Name
  describe("step 1 – app name validation", () => {
    it("rejects empty app name", () => {
      expect(validateWizardStep({ ...validInput, step: 1, appName: "" })).toBe("appNameRequired");
    });

    it("rejects whitespace-only app name", () => {
      expect(validateWizardStep({ ...validInput, step: 1, appName: "   " })).toBe("appNameRequired");
    });

    it("accepts valid app name", () => {
      expect(validateWizardStep({ ...validInput, step: 1, appName: "WeatherPro" })).toBeNull();
    });

    it("accepts single character app name", () => {
      expect(validateWizardStep({ ...validInput, step: 1, appName: "X" })).toBeNull();
    });
  });

  // Step 2: No validation required
  describe("step 2 – no validation", () => {
    it("passes with any input", () => {
      expect(validateWizardStep({ ...validInput, step: 2, appName: "" })).toBeNull();
    });
  });

  // Step 3: Uploaded screens
  describe("step 3 – uploaded screens validation", () => {
    it("rejects zero uploaded screens", () => {
      expect(validateWizardStep({ ...validInput, step: 3, uploadedScreensCount: 0 })).toBe("rawScreenRequired");
    });

    it("accepts one uploaded screen", () => {
      expect(validateWizardStep({ ...validInput, step: 3, uploadedScreensCount: 1 })).toBeNull();
    });

    it("accepts many uploaded screens", () => {
      expect(validateWizardStep({ ...validInput, step: 3, uploadedScreensCount: 10 })).toBeNull();
    });
  });

  // Steps 4 and 5: No validation required
  describe("steps 4 and 5 – no validation", () => {
    it("step 4 passes with any input", () => {
      expect(validateWizardStep({ ...validInput, step: 4 })).toBeNull();
    });

    it("step 5 passes with any input", () => {
      expect(validateWizardStep({ ...validInput, step: 5 })).toBeNull();
    });
  });

  // Step 6: Headlines validation
  describe("step 6 – slide headlines validation", () => {
    it("rejects slides with empty headline", () => {
      const result = validateWizardStep({
        ...validInput,
        step: 6,
        slides: [{ headline: "Valid" }, { headline: "" }],
      });
      expect(result).toBe("headlineRequired");
    });

    it("rejects slides with null headline", () => {
      const result = validateWizardStep({
        ...validInput,
        step: 6,
        slides: [{ headline: "Valid" }, { headline: null }],
      });
      expect(result).toBe("headlineRequired");
    });

    it("rejects slides with whitespace-only headline", () => {
      const result = validateWizardStep({
        ...validInput,
        step: 6,
        slides: [{ headline: "   " }],
      });
      expect(result).toBe("headlineRequired");
    });

    it("accepts all slides with valid headlines", () => {
      const result = validateWizardStep({
        ...validInput,
        step: 6,
        slides: [
          { headline: "First Slide" },
          { headline: "Second Slide" },
          { headline: "Third Slide" },
        ],
      });
      expect(result).toBeNull();
    });

    it("accepts single slide with valid headline", () => {
      const result = validateWizardStep({
        ...validInput,
        step: 6,
        slides: [{ headline: "Only Slide" }],
      });
      expect(result).toBeNull();
    });

    it("rejects when any slide in a large set is missing headline", () => {
      const slides = Array.from({ length: 10 }, (_, i) => ({
        headline: i === 7 ? "" : `Slide ${i + 1}`,
      }));
      expect(validateWizardStep({ ...validInput, step: 6, slides })).toBe("headlineRequired");
    });
  });

  // Step 7: No validation required
  describe("step 7 – review step", () => {
    it("passes with any input", () => {
      expect(validateWizardStep({ ...validInput, step: 7 })).toBeNull();
    });
  });
});
