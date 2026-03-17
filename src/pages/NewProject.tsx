import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Save, Loader2 } from "lucide-react";
import { ProjectWizardProvider, useNewProject } from "@/contexts/NewProjectContext";
import { useTranslation } from "react-i18next";
import { StepProject } from "@/components/new-project/StepProject";
import { StepAppInfo } from "@/components/new-project/StepAppInfo";
import { StepScreens } from "@/components/new-project/StepScreens";
import { StepBrandKit } from "@/components/new-project/StepBrandKit";
import { StepStyle } from "@/components/new-project/StepStyle";
import { StepPlanner } from "@/components/new-project/StepPlanner";
import { StepReview } from "@/components/new-project/StepReview";
import { useToast } from "@/hooks/use-toast";

const stepKeys = ['project', 'appInfo', 'screens', 'brandKit', 'style', 'planner', 'review'] as const;

const WizardContent = () => {
  const { currentStep, setCurrentStep, next, prev, isSaving, lastSavedAt, handleSaveDraft, validateStep, canProceedToNext } = useNewProject();
  const { t } = useTranslation();
  const { toast } = useToast();

  const steps = stepKeys.map((key, i) => ({ id: i + 1, label: t(`newProject.steps.${key}`) }));
  const nextValidationError = validateStep();

  const handleNext = () => {
    const error = nextValidationError;
    if (error) {
      toast({
        title: t("common.error"),
        description: error,
        variant: "destructive",
      });
      return;
    }
    next();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-1 mb-10 overflow-x-auto pb-4 hide-scrollbar">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => {
                if (step.id > currentStep) {
                  const error = validateStep();
                  if (error) {
                    toast({ title: t("common.error"), description: error, variant: "destructive" });
                    return;
                  }
                }
                setCurrentStep(step.id);
              }}
              disabled={step.id > currentStep + 1 || (step.id > currentStep && !canProceedToNext())}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${currentStep === step.id ? 'bg-primary/20 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)] border border-primary/30' :
                currentStep > step.id ? 'bg-green-500/15 text-green-500 hover:bg-green-500/25 border border-green-500/20' :
                  'bg-muted/50 text-foreground/40 hover:bg-muted hover:text-muted-foreground border border-transparent'
                }`}
            >
              {currentStep > step.id ? <CheckCircle2 className="h-4 w-4" /> : <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${currentStep === step.id ? 'bg-primary/30 text-primary' : 'bg-card/90'}`}>{step.id}</span>}
              <span className="hidden sm:inline tracking-tight">{step.label}</span>
            </button>
            {i < steps.length - 1 && <div className={`w-6 h-px mx-2 ${currentStep > step.id ? 'bg-green-500/50' : 'bg-border'}`} />}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {lastSavedAt && (
            <span className="text-[10px] text-muted-foreground font-medium">
              {t('newProject.saved')} {lastSavedAt.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving} className="rounded-full text-xs font-bold border-border hover:border-primary/40 h-9 px-4">
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Save className="h-3 w-3 mr-1.5" />}
            {t('newProject.saveDraft')}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[400px] bg-card/90 border border-border rounded-3xl p-8 backdrop-blur-xl shadow-elevated relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

          {currentStep === 1 && <StepProject />}
          {currentStep === 2 && <StepAppInfo />}
          {currentStep === 3 && <StepScreens />}
          {currentStep === 4 && <StepBrandKit />}
          {currentStep === 5 && <StepStyle />}
          {currentStep === 6 && <StepPlanner />}
          {currentStep === 7 && <StepReview />}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-12 pt-8 border-t border-border relative z-10">
        <Button variant="secondary" onClick={prev} disabled={currentStep === 1} className="bg-muted/50 text-foreground hover:bg-muted border-border h-12 px-6 rounded-xl font-bold tracking-tight">
          <ArrowLeft className="mr-2 h-4.5 w-4.5" /> {t('newProject.back')}
        </Button>
        {currentStep < 7 ? (
          <Button
            variant="default"
            onClick={handleNext}
            disabled={!canProceedToNext()}
            className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8 rounded-xl font-black tracking-tight shadow-glow hover:shadow-[0_0_20px_hsl(var(--foreground)/0.4)] transition-all"
          >
            {t('newProject.continue')} <ArrowRight className="ml-2 h-4.5 w-4.5" />
          </Button>
        ) : null}
      </div>
      {currentStep < 7 && nextValidationError && (
        <p className="mt-3 text-xs text-destructive font-medium text-right">{nextValidationError}</p>
      )}
    </div>
  );
};

const NewProject = () => {
  return (
    <DashboardLayout>
      <ProjectWizardProvider>
        <WizardContent />
      </ProjectWizardProvider>
    </DashboardLayout>
  );
};

export default NewProject;
