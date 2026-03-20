import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import slide01 from '@/assets/gallery/slide-01-learners.png';
import slide02 from '@/assets/gallery/slide-02-allinone.png';
import slide03 from '@/assets/gallery/slide-03-bitesized.png';
import slide04 from '@/assets/gallery/slide-04-speaking.png';
import slide05 from '@/assets/gallery/slide-05-streak.png';
import slide06 from '@/assets/gallery/slide-06-widgets.png';
import slide07 from '@/assets/gallery/slide-07-culture.png';
import slide08 from '@/assets/gallery/slide-08-progress.png';
import slide09 from '@/assets/gallery/slide-09-motivation.png';
import slide10 from '@/assets/gallery/slide-10-closing.png';

const slideImages = [
  slide01,
  slide02,
  slide03,
  slide04,
  slide05,
  slide06,
  slide07,
  slide08,
  slide09,
  slide10,
] as const;

export const BatchGenerationGrid = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { t } = useTranslation();

  const localizedSlideLabels = t('landing.batchGeneration.slideLabels', { returnObjects: true }) as string[];
  const slideLabels = Array.isArray(localizedSlideLabels) ? localizedSlideLabels : [];

  return (
    <section className="py-32 bg-surface-elevated relative overflow-hidden flex flex-col items-center">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none z-10" />

      <div className="container relative mx-auto px-6 text-center z-20 mb-16" ref={ref}>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6 leading-tight max-w-4xl mx-auto">
          {t('landing.batchGeneration.titlePrefix')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">{t('landing.batchGeneration.titleHighlight')}</span>{' '}
          {t('landing.batchGeneration.titleSuffix')}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
          {t('landing.batchGeneration.subtitle')}
        </p>
      </div>

      <div className="relative z-0 w-full max-w-[1400px] mx-auto px-6 perspective-[2000px]">
        <motion.div
          className="flex flex-wrap justify-center gap-3 md:gap-4 lg:gap-6"
          initial={{ rotateX: 0, rotateY: 0, scale: 1 }}
          animate={isInView ? { rotateX: 10, rotateY: -5, scale: 0.95 } : {}}
          transition={{ delay: 2.5, duration: 1.5, type: 'spring', bounce: 0.2 }}
        >
          {slideImages.map((src, i) => {
            const delay = i * 0.15;

            return (
              <motion.div
                key={i}
                className="relative w-[80px] sm:w-[100px] md:w-[140px] lg:w-[180px] aspect-[9/19.5] rounded-xl md:rounded-2xl border border-border bg-zinc-900 overflow-hidden shadow-elevated"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay, duration: 0.5, ease: 'easeOut' }}
              >
                <motion.div
                  className="absolute inset-0 bg-primary/20 flex flex-col items-center justify-center p-2 md:p-4 gap-2 border border-primary/30 z-20"
                  initial={{ opacity: 1 }}
                  animate={isInView ? { opacity: 0 } : {}}
                  transition={{ delay: delay + 1.2, duration: 0.3 }}
                >
                  <div className="w-1/2 h-1/2 rounded-full border-2 border-primary border-t-transparent animate-spin opacity-50 max-w-[30px] max-h-[30px]" />
                  <div className="h-1 lg:h-2 w-full bg-primary/30 rounded-full mt-auto overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: '0%' }}
                      animate={isInView ? { width: '100%' } : {}}
                      transition={{ delay: delay + 0.2, duration: 0.8, ease: 'easeInOut' }}
                    />
                  </div>
                </motion.div>

                <motion.div
                  className="absolute inset-0 z-10"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: delay + 1.2, duration: 0.4, type: 'spring' }}
                >
                  <img
                    src={src}
                    alt={slideLabels[i] ?? `slide-${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </motion.div>

                <motion.div
                  className="absolute inset-0 bg-white z-30 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: [0, 0.8, 0] } : {}}
                  transition={{ delay: delay + 1.2, duration: 0.5 }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
