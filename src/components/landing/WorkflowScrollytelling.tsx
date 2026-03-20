import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import appLogo from '@/assets/logo-shotapp.png';
import agency13 from '@/assets/gallery/agency-13-vow.png';
import agency11 from '@/assets/gallery/agency-11-trainer-ai.png';
import agency14 from '@/assets/gallery/agency-14-rpg.png';
import agency22 from '@/assets/gallery/agency-22-mealplan.png';
import weatherRaw1 from '@/assets/features/weather-raw-1.png';
import weatherRaw2 from '@/assets/features/weather-raw-2.png';

type WorkflowStep = {
  id: number;
  title: string;
  description: string;
};

export const WorkflowScrollytelling = () => {
  const { t } = useTranslation();
  const localizedSteps = t('landing.workflow.steps', { returnObjects: true }) as WorkflowStep[];
  const steps = Array.isArray(localizedSteps) && localizedSteps.length > 0
    ? localizedSteps
    : [{ id: 1, title: '', description: '' }];

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      const stepIndex = Math.min(
        Math.max(0, Math.floor(latest * steps.length)),
        steps.length - 1,
      );
      if (stepIndex !== activeStep) {
        setActiveStep(stepIndex);
      }
    });
  }, [scrollYProgress, activeStep, steps.length]);

  const localizedTemplateNames = t('landing.workflow.templateNames', { returnObjects: true }) as string[];
  const templateNames = Array.isArray(localizedTemplateNames) ? localizedTemplateNames : [];

  return (
    <section id="workflow" ref={containerRef} className="relative bg-background" style={{ height: '300vh' }}>
      <div className="sticky top-0 h-screen w-full flex items-center overflow-visible">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none mix-blend-screen opacity-20"
          animate={{
            backgroundColor: ['#f5a623', '#1e3a8a', '#e11d48', '#f5a623', '#10b981', '#1e3a8a'][activeStep],
          }}
          transition={{ duration: 1 }}
        />

        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 lg:gap-24 relative z-10 w-full">
          <div className="flex flex-col justify-center h-full max-w-xl py-12">
            <div className="mb-4 inline-block">
              <span className="text-primary font-bold tracking-widest uppercase text-sm">{t('landing.workflow.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-tight mb-12">
              {t('landing.workflow.title')}
            </h2>

            <div className="relative pl-8">
              <div className="absolute left-3 top-2 bottom-6 w-0.5 bg-white/10">
                <motion.div
                  className="absolute top-0 left-0 w-full bg-primary"
                  style={{ height: useTransform(scrollYProgress, [0, 1], ['0%', '100%']) }}
                />
              </div>

              <div className="space-y-12">
                {steps.map((step, index) => {
                  const isActive = index === activeStep;
                  const isPast = index < activeStep;

                  return (
                    <div
                      key={step.id}
                      className={`relative transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-30'}`}
                    >
                      <div className={`absolute -left-8 top-1 h-2.5 w-2.5 rounded-full ring-4 ${isActive ? 'bg-primary ring-primary/30' : isPast ? 'bg-primary/50 ring-transparent' : 'bg-white/20 ring-transparent'} transition-all duration-500`} />
                      <h3 className="text-2xl font-bold text-foreground mb-2">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-lg">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col justify-center h-full relative perspective-[2000px]">
            <div className="relative w-full aspect-square max-h-[600px] max-w-[600px] rounded-3xl bg-zinc-900/50 border border-border backdrop-blur-xl shadow-2xl overflow-hidden flex items-center justify-center p-8">
              <AnimatePresence mode="popLayout">
                {activeStep === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="w-full h-full border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center bg-black/5"
                  >
                    <div className="grid grid-cols-2 gap-4 w-3/4">
                      <div className="aspect-[9/19.5] rounded-xl shadow-lg border border-border overflow-hidden -rotate-6 translate-y-4">
                        <img src={weatherRaw1} alt={t('landing.workflow.rawAlts.0')} className="w-full h-full object-cover" />
                      </div>
                      <div className="aspect-[9/19.5] rounded-xl shadow-lg border border-border overflow-hidden rotate-6 -translate-y-4">
                        <img src={weatherRaw2} alt={t('landing.workflow.rawAlts.1')} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="w-full h-full flex flex-col items-center justify-center gap-6"
                  >
                    <img src={appLogo} alt={t('landing.workflow.brandKitAlt')} className="w-24 h-24 rounded-2xl shadow-glow object-cover border border-border" />
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-[hsl(var(--primary))] border border-border shadow-md" />
                      <div className="w-12 h-12 rounded-full bg-[hsl(30,90%,45%)] border border-border shadow-md" />
                      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-border shadow-md" />
                      <div className="w-12 h-12 rounded-full bg-zinc-100 border border-border shadow-md" />
                    </div>
                    <div className="w-48 h-12 rounded-lg bg-card/50 border border-border flex items-center px-4 font-mono text-muted-foreground text-sm">
                      {t('landing.workflow.brandKitFont')}
                    </div>
                  </motion.div>
                )}

                {activeStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="w-full h-full grid grid-cols-2 gap-3 p-2"
                  >
                    {[
                      { src: agency13, name: templateNames[0] },
                      { src: agency11, name: templateNames[1] },
                      { src: agency14, name: templateNames[2] },
                      { src: agency22, name: templateNames[3] },
                    ].map((template, i) => (
                      <div key={i} className={`rounded-xl border overflow-hidden ${i === 0 ? 'border-primary ring-2 ring-primary/20' : 'border-border'} flex flex-col`}>
                        <img src={template.src} alt={template.name} className="w-full flex-1 object-cover" />
                        <div className="px-3 py-2 bg-card/80 border-t border-border">
                          <span className="text-xs font-medium text-foreground">{template.name}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="w-full h-full p-4 sm:p-6 flex flex-col gap-4 items-center justify-center bg-[#111111] border border-white/5 rounded-2xl shadow-elevated relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />

                    <div className="relative z-10 w-full flex flex-col gap-4">
                      {[
                        { id: 1, title: t('landing.workflow.planCards.0.title'), priority: t('landing.workflow.planCards.0.priority'), priorityColor: 'bg-red-500/10 text-red-500 border border-red-500/20', input: t('landing.workflow.planCards.0.input') },
                        { id: 2, title: t('landing.workflow.planCards.1.title'), priority: t('landing.workflow.planCards.1.priority'), priorityColor: 'bg-red-500/10 text-red-500 border border-red-500/20', input: t('landing.workflow.planCards.1.input') },
                        { id: 3, title: t('landing.workflow.planCards.2.title'), priority: t('landing.workflow.planCards.2.priority'), priorityColor: 'bg-amber-500/10 text-amber-500 border border-amber-500/20', input: t('landing.workflow.planCards.2.input') },
                      ].map((slide) => (
                        <div key={slide.id} className="w-full bg-[#18181A] border border-white/5 rounded-xl p-3 sm:p-4 flex gap-3 sm:gap-4 transition-all duration-300 hover:border-white/10">
                          <div className="flex flex-col items-center pt-1 gap-2 shrink-0 opacity-40 hidden sm:flex">
                            <div className="w-1 h-1 rounded-full bg-white" />
                            <div className="w-1 h-1 rounded-full bg-white" />
                            <div className="w-1 h-1 rounded-full bg-white" />
                          </div>
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[#FF9500] shrink-0 flex items-center justify-center text-black font-bold text-sm sm:text-lg shadow-[0_0_15px_-3px_rgba(255,149,0,0.5)]">
                            {slide.id}
                          </div>
                          <div className="flex flex-col flex-1 gap-2 sm:gap-3">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <span className="text-white font-bold text-xs sm:text-sm tracking-tight">{slide.title}</span>
                              <span className={`text-[8px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md ${slide.priorityColor}`}>
                                {slide.priority}
                              </span>
                            </div>
                            <div className="w-full bg-[#111111] border border-white/5 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-[#A1A1AA]">
                              {slide.input}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeStep === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="w-full h-full flex items-center justify-center relative"
                  >
                    <div className="absolute inset-0 flex items-center justify-center gap-2">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: '60%' }}
                          transition={{ delay: i * 0.2, duration: 0.8, ease: 'easeOut' }}
                          className="w-24 bg-gradient-to-b from-primary to-orange-600 rounded-xl border border-border shadow-glow overflow-hidden relative"
                        >
                          <div className="absolute top-0 left-0 right-0 h-1 bg-white/50 animate-pulse" />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeStep === 5 && (
                  <motion.div
                    key="step-5"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="w-full h-full flex flex-col items-center justify-center gap-6"
                  >
                    <div className="w-32 h-32 rounded-3xl bg-white/10 border border-border backdrop-blur-md flex items-center justify-center shadow-elevated">
                      <div className="text-5xl">📦</div>
                    </div>
                    <div className="text-center">
                      <h4 className="text-foreground font-bold text-xl mb-2">{t('landing.workflow.export.fileName')}</h4>
                      <p className="text-muted-foreground">{t('landing.workflow.export.meta')}</p>
                    </div>
                    <div className="px-6 py-2 rounded-full bg-primary/20 border border-primary/50 text-foreground font-medium flex items-center gap-2">
                      {t('landing.workflow.export.readyLabel')}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
