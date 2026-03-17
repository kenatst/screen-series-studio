type SlideValidationInput = {
  headline?: string | null;
};

type ValidateWizardStepInput = {
  step: number;
  appName: string;
  uploadedScreensCount: number;
  slides: SlideValidationInput[];
};

export function validateWizardStep(input: ValidateWizardStepInput): string | null {
  const { step, appName, uploadedScreensCount, slides } = input;

  if (step === 1 && !appName.trim()) {
    return "App name is required.";
  }

  if (step === 3 && uploadedScreensCount === 0) {
    return "Upload at least one raw screen before continuing.";
  }

  if (step === 6) {
    const hasMissingCopy = slides.some((slide) => !slide.headline?.trim());
    if (hasMissingCopy) {
      return "Every slide needs at least a headline before review.";
    }
  }

  return null;
}
