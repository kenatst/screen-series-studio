type SlideValidationInput = {
  headline?: string | null;
};

export type WizardValidationError =
  | "appNameRequired"
  | "rawScreenRequired"
  | "headlineRequired";

type ValidateWizardStepInput = {
  step: number;
  appName: string;
  uploadedScreensCount: number;
  slides: SlideValidationInput[];
};

export function validateWizardStep(input: ValidateWizardStepInput): WizardValidationError | null {
  const { step, appName, uploadedScreensCount, slides } = input;

  if (step === 1 && !appName.trim()) {
    return "appNameRequired";
  }

  if (step === 3 && uploadedScreensCount === 0) {
    return "rawScreenRequired";
  }

  if (step === 6) {
    const hasMissingCopy = slides.some((slide) => !slide.headline?.trim());
    if (hasMissingCopy) {
      return "headlineRequired";
    }
  }

  return null;
}
