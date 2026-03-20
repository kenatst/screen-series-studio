import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import agency01 from '@/assets/gallery/agency-01-habit.png';
import agency02 from '@/assets/gallery/agency-02-coach.png';
import agency03 from '@/assets/gallery/agency-03-map.png';
import agency04 from '@/assets/gallery/agency-04-subs.png';
import agency05 from '@/assets/gallery/agency-05-water.png';
import agency06 from '@/assets/gallery/agency-06-sugar.png';
import agency07 from '@/assets/gallery/agency-07-aura.png';
import agency08 from '@/assets/gallery/agency-08-scribe.png';
import agency09 from '@/assets/gallery/agency-09-trainer.png';
import agency10 from '@/assets/gallery/agency-10-stackr.png';
import agency11 from '@/assets/gallery/agency-11-trainer-ai.png';
import agency12 from '@/assets/gallery/agency-12-stackr-yellow.png';
import agency13 from '@/assets/gallery/agency-13-vow.png';
import agency14 from '@/assets/gallery/agency-14-rpg.png';
import agency15 from '@/assets/gallery/agency-15-cram.png';
import agency16 from '@/assets/gallery/agency-16-adblock.png';
import agency17 from '@/assets/gallery/agency-17-drift.png';
import agency18 from '@/assets/gallery/agency-18-coaching.png';
import agency19 from '@/assets/gallery/agency-19-tape.png';
import agency20 from '@/assets/gallery/agency-20-solo.png';
import agency21 from '@/assets/gallery/agency-21-minddrop.png';
import agency22 from '@/assets/gallery/agency-22-mealplan.png';
import agency23 from '@/assets/gallery/agency-23-vault.jpeg';
import agency24 from '@/assets/gallery/agency-24-linguaflow.png';
import agency25 from '@/assets/gallery/agency-25-nestle.png';
import agency26 from '@/assets/gallery/agency-26-lifeplan.png';
import agency27 from '@/assets/gallery/agency-27-foxlearn.png';

const GALLERY_IMAGES = [
  agency01,
  agency02,
  agency03,
  agency04,
  agency05,
  agency06,
  agency07,
  agency08,
  agency09,
  agency10,
  agency11,
  agency12,
  agency13,
  agency14,
  agency15,
  agency16,
  agency17,
  agency18,
  agency19,
  agency20,
  agency21,
  agency22,
  agency23,
  agency24,
  agency25,
  agency26,
  agency27,
] as const;

type GalleryCopyItem = {
  title: string;
  style: string;
};

export const Gallery = () => {
  const { t } = useTranslation();
  const localizedItemsRaw = t('landing.gallery.items', { returnObjects: true }) as GalleryCopyItem[];
  const localizedItems = Array.isArray(localizedItemsRaw) ? localizedItemsRaw : [];

  const galleryItems = GALLERY_IMAGES.map((src, index) => {
    const localizedItem = localizedItems[index];
    return {
      id: index + 1,
      src,
      title: localizedItem?.title ?? `Item ${index + 1}`,
      style: localizedItem?.style ?? '',
    };
  });

  return (
    <section id="examples" className="py-24 bg-background relative overflow-hidden border-t border-border">
      <div className="container mx-auto px-6 mb-16 text-center">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6">
          {t('landing.gallery.title')}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('landing.gallery.subtitle')}
        </p>
      </div>

      <div className="relative w-full flex overflow-hidden">
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-6 px-6"
          animate={{ x: [0, -8500] }}
          transition={{ repeat: Infinity, ease: 'linear', duration: 120 }}
        >
          {[...galleryItems, ...galleryItems].map((item, i) => (
            <div
              key={`row1-${item.id}-${i}`}
              className="relative w-[320px] md:w-[480px] aspect-video rounded-2xl overflow-hidden group flex-shrink-0 cursor-pointer border border-border bg-card/50"
            >
              <img
                src={item.src}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div>
                  <h4 className="text-white font-bold text-lg">{item.title}</h4>
                  <span className="text-white/80 text-sm font-medium">{item.style}</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="relative w-full flex overflow-hidden mt-6">
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-6 px-6"
          animate={{ x: [-8500, 0] }}
          transition={{ repeat: Infinity, ease: 'linear', duration: 120 }}
        >
          {[...galleryItems, ...galleryItems].reverse().map((item, i) => (
            <div
              key={`row2-${item.id}-${i}`}
              className="relative w-[320px] md:w-[480px] aspect-video rounded-2xl overflow-hidden group flex-shrink-0 cursor-pointer border border-border bg-card/50"
            >
              <img
                src={item.src}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div>
                  <h4 className="text-white font-bold text-lg">{item.title}</h4>
                  <span className="text-white/80 text-sm font-medium">{item.style}</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
