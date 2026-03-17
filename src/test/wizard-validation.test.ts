import { describe, expect, it } from "vitest";
import { validateWizardStep } from "@/lib/wizard-validation";

describe("validateWizardStep", () => {
  it("requires app name on step 1", () => {
    const result = validateWizardStep({
      step: 1,
      appName: "",
      uploadedScreensCount: 1,
      slides: [{ headline: "Headline" }],
    });

    expect(result).toBe("App name is required.");
  });

  it("requires at least one uploaded screen on step 3", () => {
    const result = validateWizardStep({
      step: 3,
      appName: "My App",
      uploadedScreensCount: 0,
      slides: [{ headline: "Headline" }],
    });

    expect(result).toBe("Upload at least one raw screen before continuing.");
  });

  it("requires headlines on review step", () => {
    const result = validateWizardStep({
      step: 6,
      appName: "My App",
      uploadedScreensCount: 2,
      slides: [{ headline: "Ready" }, { headline: "" }],
    });

    expect(result).toBe("Every slide needs at least a headline before review.");
  });

  it("passes when requirements are met", () => {
    const result = validateWizardStep({
      step: 6,
      appName: "My App",
      uploadedScreensCount: 2,
      slides: [{ headline: "A" }, { headline: "B" }],
    });

    expect(result).toBeNull();
  });
});
