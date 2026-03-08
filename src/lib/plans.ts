export type PlanId = 'free' | 'starter' | 'pro' | 'unlimited';

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: string;
  priceValue: number; // in cents
  description: string;
  features: string[];
  notIncluded: string[];
  limits: {
    maxProjects: number;
    maxSlidesPerSet: number;
    translations: boolean;
    unlimitedTranslations: boolean;
    redesigns: number; // -1 = unlimited
    brandKit: boolean;
    priorityGeneration: boolean;
    watermark: boolean;
    hdExport: boolean;
  };
  popular: boolean;
  cta: string;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    price: 'Free',
    priceValue: 0,
    description: 'Test the power of ScreenForge.',
    features: [
      '1 sample slide',
      'Standard templates',
      'Watermarked export',
    ],
    notIncluded: [
      'Full screenshot sets',
      'HD export',
      'Brand Kit integration',
      'Translations',
    ],
    limits: {
      maxProjects: 1,
      maxSlidesPerSet: 1,
      translations: false,
      unlimitedTranslations: false,
      redesigns: 0,
      brandKit: false,
      priorityGeneration: false,
      watermark: true,
      hdExport: false,
    },
    popular: false,
    cta: 'Try free',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '€49',
    priceValue: 4900,
    description: 'Perfect for launching one app.',
    features: [
      '1 app workspace',
      'Up to 10 slides per set',
      'HD export',
      'Limited redesigns (3)',
    ],
    notIncluded: [
      '1-Click Translations',
      'Full Brand Kit control',
      'Priority generation',
    ],
    limits: {
      maxProjects: 1,
      maxSlidesPerSet: 10,
      translations: false,
      unlimitedTranslations: false,
      redesigns: 3,
      brandKit: false,
      priorityGeneration: false,
      watermark: false,
      hdExport: true,
    },
    popular: false,
    cta: 'Get started',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€99',
    priceValue: 9900,
    description: 'For builders shipping multiple apps.',
    features: [
      '3 app workspaces',
      '1-Click Translations',
      'Full Brand Kit control',
      'Priority generation',
      'More redesigns (10)',
    ],
    notIncluded: [
      'Unlimited workspaces',
      'Unlimited translations',
    ],
    limits: {
      maxProjects: 3,
      maxSlidesPerSet: 10,
      translations: true,
      unlimitedTranslations: false,
      redesigns: 10,
      brandKit: true,
      priorityGeneration: true,
      watermark: false,
      hdExport: true,
    },
    popular: true,
    cta: 'Go Pro',
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '€399',
    priceValue: 39900,
    description: 'No limits for premium ASO teams.',
    features: [
      'Unlimited app workspaces',
      'Unlimited translations',
      'Unlimited redesigns',
      'Priority queue',
      'Agency-scale usage',
    ],
    notIncluded: [],
    limits: {
      maxProjects: -1,
      maxSlidesPerSet: 10,
      translations: true,
      unlimitedTranslations: true,
      redesigns: -1,
      brandKit: true,
      priorityGeneration: true,
      watermark: false,
      hdExport: true,
    },
    popular: false,
    cta: 'Go Unlimited',
  },
];

export function getPlanById(id: PlanId): PlanConfig {
  return PLANS.find(p => p.id === id) || PLANS[0];
}

export function canCreateProject(plan: PlanId, currentProjectCount: number): boolean {
  const config = getPlanById(plan);
  if (config.limits.maxProjects === -1) return true;
  return currentProjectCount < config.limits.maxProjects;
}

export function getMaxSlides(plan: PlanId): number {
  return getPlanById(plan).limits.maxSlidesPerSet;
}

export function canTranslate(plan: PlanId): boolean {
  return getPlanById(plan).limits.translations;
}

export function canRedesign(plan: PlanId, usedRedesigns: number): boolean {
  const config = getPlanById(plan);
  if (config.limits.redesigns === -1) return true;
  return usedRedesigns < config.limits.redesigns;
}

export function hasWatermark(plan: PlanId): boolean {
  return getPlanById(plan).limits.watermark;
}
