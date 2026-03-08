export type PlanId = 'free' | 'starter' | 'pro' | 'unlimited';

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: string;
  priceValue: number;
  description: string;
  features: string[];
  notIncluded: string[];
  limits: {
    maxProjects: number;
    maxSlidesPerSet: number;
    translations: boolean;
    unlimitedTranslations: boolean;
    redesigns: number;
    brandKit: boolean;
    priorityGeneration: boolean;
    watermark: boolean;
    hdExport: boolean;
  };
  popular: boolean;
  cta: string;
  /** Credits granted per month with the plan */
  monthlyCredits: number;
}

/** Credit costs per action */
export const CREDIT_COSTS = {
  generateSlide: 1,
  regenerateSlide: 1,
  translateSlide: 2,
  exportSet: 0,
} as const;

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    price: 'Free',
    priceValue: 0,
    description: 'Test the power of ScreenForge.',
    features: [
      '3 credits included',
      'Standard templates',
      'Watermarked export',
    ],
    notIncluded: [
      'Full screenshot sets',
      'HD export',
      'Brand Kit integration',
    ],
    limits: {
      maxProjects: 1,
      maxSlidesPerSet: 3,
      translations: true,
      unlimitedTranslations: false,
      redesigns: 0,
      brandKit: false,
      priorityGeneration: false,
      watermark: true,
      hdExport: false,
    },
    popular: false,
    cta: 'Try free',
    monthlyCredits: 3,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '€49',
    priceValue: 4900,
    description: 'Perfect for launching one app.',
    features: [
      '1 app workspace',
      '50 credits/month',
      'HD export, no watermark',
      'Up to 10 slides per set',
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
    monthlyCredits: 50,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€99',
    priceValue: 9900,
    description: 'For builders shipping multiple apps.',
    features: [
      '3 app workspaces',
      '200 credits/month',
      '1-Click Translations',
      'Full Brand Kit control',
      'Priority generation',
    ],
    notIncluded: [
      'Unlimited workspaces',
      'Unlimited credits',
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
    monthlyCredits: 200,
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '€399',
    priceValue: 39900,
    description: 'No limits for premium ASO teams.',
    features: [
      'Unlimited workspaces',
      '1000 credits/month',
      'Unlimited translations',
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
    monthlyCredits: 1000,
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

export function canRegenerate(plan: PlanId): boolean {
  return plan !== 'free';
}
