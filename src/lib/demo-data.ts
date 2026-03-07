export interface DemoProject {
  id: string;
  name: string;
  appName: string;
  platform: 'ios' | 'android' | 'both';
  category: string;
  icon: string;
  slideCount: number;
  locale: string;
  status: 'draft' | 'generating' | 'completed' | 'editing';
  template: string;
  lastUpdated: string;
  description: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  preview: string;
  tags: string[];
  bestFor: string;
  complexity: 'simple' | 'medium' | 'complex';
  conversionAngle: string;
  category: string;
  slidesSupported: number;
  tone: string;
}

export interface SlideItem {
  id: string;
  number: number;
  objective: string;
  headline: string;
  subheadline: string;
  keyMessage: string;
  rawScreenTag: string;
  emphasis: string;
  importance: 'high' | 'medium' | 'low';
  status: 'pending' | 'generating' | 'completed' | 'editing';
  locked: string[];
}

export const demoProjects: DemoProject[] = [
  {
    id: 'proj-1',
    name: 'LinguaPal Launch',
    appName: 'LinguaPal',
    platform: 'both',
    category: 'Education',
    icon: '🦜',
    slideCount: 5,
    locale: 'EN-US',
    status: 'completed',
    template: 'Educational Playful',
    lastUpdated: '2 hours ago',
    description: 'Fun language learning with AI-powered conversations and cute mascots',
  },
  {
    id: 'proj-2',
    name: 'FitForge Redesign',
    appName: 'FitForge',
    platform: 'ios',
    category: 'Health & Fitness',
    icon: '💪',
    slideCount: 7,
    locale: 'EN-US',
    status: 'editing',
    template: 'Bold Gaming',
    lastUpdated: '5 hours ago',
    description: 'AI-powered fitness coaching with personalized workout plans',
  },
  {
    id: 'proj-3',
    name: 'CashFlow Pro',
    appName: 'CashFlow',
    platform: 'android',
    category: 'Finance',
    icon: '💰',
    slideCount: 10,
    locale: 'FR-FR',
    status: 'draft',
    template: 'Premium Gradient',
    lastUpdated: '1 day ago',
    description: 'Smart budgeting and expense tracking made simple',
  },
];

export const demoTemplates: TemplateItem[] = [
  { id: 't1', name: 'Clean SaaS', preview: '', tags: ['minimal', 'professional', 'clean'], bestFor: 'B2B apps, productivity tools', complexity: 'simple', conversionAngle: 'Trust & clarity', category: 'Business', slidesSupported: 10, tone: 'corporate' },
  { id: 't2', name: 'Bold Gaming', preview: '', tags: ['vibrant', 'energetic', 'dynamic'], bestFor: 'Games, entertainment apps', complexity: 'complex', conversionAngle: 'Excitement & engagement', category: 'Entertainment', slidesSupported: 10, tone: 'bold' },
  { id: 't3', name: 'Premium Gradient', preview: '', tags: ['premium', 'gradient', 'sleek'], bestFor: 'Finance, lifestyle apps', complexity: 'medium', conversionAngle: 'Premium positioning', category: 'Lifestyle', slidesSupported: 10, tone: 'premium' },
  { id: 't4', name: 'Educational Playful', preview: '', tags: ['playful', 'colorful', 'friendly'], bestFor: 'Education, kids apps', complexity: 'medium', conversionAngle: 'Fun & learning', category: 'Education', slidesSupported: 10, tone: 'playful' },
  { id: 't5', name: 'Lifestyle', preview: '', tags: ['organic', 'warm', 'aspirational'], bestFor: 'Health, wellness, travel', complexity: 'simple', conversionAngle: 'Aspiration', category: 'Lifestyle', slidesSupported: 10, tone: 'minimalist' },
  { id: 't6', name: 'Luxury Minimal', preview: '', tags: ['luxury', 'minimal', 'elegant'], bestFor: 'Premium services, luxury brands', complexity: 'simple', conversionAngle: 'Exclusivity', category: 'Luxury', slidesSupported: 7, tone: 'premium' },
  { id: 't7', name: 'Feature-Led', preview: '', tags: ['structured', 'feature-focused', 'clear'], bestFor: 'Utility apps, SaaS', complexity: 'medium', conversionAngle: 'Feature showcase', category: 'Business', slidesSupported: 10, tone: 'corporate' },
  { id: 't8', name: 'Comparison-Driven', preview: '', tags: ['competitive', 'data-driven', 'bold'], bestFor: 'Apps with strong differentiators', complexity: 'complex', conversionAngle: 'Competitive advantage', category: 'Business', slidesSupported: 5, tone: 'bold' },
  { id: 't9', name: 'Mascot-Led', preview: '', tags: ['character', 'friendly', 'memorable'], bestFor: 'Apps with mascots, kids apps', complexity: 'complex', conversionAngle: 'Brand personality', category: 'Entertainment', slidesSupported: 10, tone: 'playful' },
  { id: 't10', name: 'Cinematic', preview: '', tags: ['dramatic', 'immersive', 'premium'], bestFor: 'Media, video, photo apps', complexity: 'complex', conversionAngle: 'Visual impact', category: 'Media', slidesSupported: 7, tone: 'premium' },
];

export const slideObjectives = [
  'Hero / first impression',
  'Core benefit',
  'Feature spotlight',
  'Social proof',
  'Ease of use',
  'Transformation / before-after',
  'Emotional benefit',
  'Productivity gain',
  'Learning outcome',
  'Trust / credibility',
  'Premium feel',
  'Gamification',
  'CTA-like closing slide',
];

export const defaultStorylines: Record<string, SlideItem[]> = {
  '5-slide': [
    { id: 's1', number: 1, objective: 'Hero / first impression', headline: 'Your big promise here', subheadline: 'Supporting value proposition', keyMessage: 'First impression that hooks', rawScreenTag: 'home', emphasis: 'text focused', importance: 'high', status: 'pending', locked: [] },
    { id: 's2', number: 2, objective: 'Core benefit', headline: 'The #1 reason to download', subheadline: 'What makes you unique', keyMessage: 'Key differentiator', rawScreenTag: 'dashboard', emphasis: 'UI focused', importance: 'high', status: 'pending', locked: [] },
    { id: 's3', number: 3, objective: 'Feature spotlight', headline: 'Powerful feature showcase', subheadline: 'How it works', keyMessage: 'Feature demonstration', rawScreenTag: 'feature X', emphasis: 'UI focused', importance: 'medium', status: 'pending', locked: [] },
    { id: 's4', number: 4, objective: 'Ease of use', headline: 'Simple and intuitive', subheadline: 'Get started in seconds', keyMessage: 'Low friction experience', rawScreenTag: 'onboarding', emphasis: 'clean product showcase', importance: 'medium', status: 'pending', locked: [] },
    { id: 's5', number: 5, objective: 'CTA-like closing slide', headline: 'Start your journey today', subheadline: 'Join millions of users', keyMessage: 'Drive action', rawScreenTag: 'home', emphasis: 'text focused', importance: 'high', status: 'pending', locked: [] },
  ],
  '10-slide': [
    { id: 's1', number: 1, objective: 'Hero / first impression', headline: 'Your big promise here', subheadline: 'Supporting value proposition', keyMessage: 'First impression', rawScreenTag: 'home', emphasis: 'text focused', importance: 'high', status: 'pending', locked: [] },
    { id: 's2', number: 2, objective: 'Core benefit', headline: 'The main benefit', subheadline: 'Why users love it', keyMessage: 'Core value', rawScreenTag: 'dashboard', emphasis: 'UI focused', importance: 'high', status: 'pending', locked: [] },
    { id: 's3', number: 3, objective: 'Ease of use', headline: 'Easy to get started', subheadline: 'No learning curve', keyMessage: 'Simplicity', rawScreenTag: 'onboarding', emphasis: 'clean product showcase', importance: 'medium', status: 'pending', locked: [] },
    { id: 's4', number: 4, objective: 'Feature spotlight', headline: 'Feature A spotlight', subheadline: 'Deep dive', keyMessage: 'Feature power', rawScreenTag: 'feature X', emphasis: 'UI focused', importance: 'high', status: 'pending', locked: [] },
    { id: 's5', number: 5, objective: 'Emotional benefit', headline: 'Feel the difference', subheadline: 'Emotional connection', keyMessage: 'Emotional hook', rawScreenTag: 'home', emphasis: 'cinematic background', importance: 'medium', status: 'pending', locked: [] },
    { id: 's6', number: 6, objective: 'Feature spotlight', headline: 'Feature B spotlight', subheadline: 'Another key feature', keyMessage: 'Secondary feature', rawScreenTag: 'feature Y', emphasis: 'UI focused', importance: 'medium', status: 'pending', locked: [] },
    { id: 's7', number: 7, objective: 'Social proof', headline: 'Trusted by thousands', subheadline: 'Real results', keyMessage: 'Trust signals', rawScreenTag: 'analytics', emphasis: 'text focused', importance: 'medium', status: 'pending', locked: [] },
    { id: 's8', number: 8, objective: 'Trust / credibility', headline: 'Built for professionals', subheadline: 'Enterprise ready', keyMessage: 'Credibility', rawScreenTag: 'profile', emphasis: 'icon-driven', importance: 'low', status: 'pending', locked: [] },
    { id: 's9', number: 9, objective: 'Productivity gain', headline: 'Save hours every week', subheadline: 'Measurable impact', keyMessage: 'ROI focus', rawScreenTag: 'analytics', emphasis: 'text focused', importance: 'medium', status: 'pending', locked: [] },
    { id: 's10', number: 10, objective: 'CTA-like closing slide', headline: 'Start free today', subheadline: 'Join the community', keyMessage: 'Final push', rawScreenTag: 'home', emphasis: 'text focused', importance: 'high', status: 'pending', locked: [] },
  ],
};

export const screenTags = [
  'onboarding', 'home', 'dashboard', 'lesson', 'profile',
  'analytics', 'chat', 'settings', 'feature X', 'feature Y',
];

export const toneOptions = [
  'playful', 'premium', 'minimalist', 'bold', 'corporate',
  'energetic', 'educational', 'gaming',
];

export const emphasisOptions = [
  'UI focused', 'text focused', 'mascot focused', 'illustration focused',
  'cinematic background', 'clean product showcase', 'icon-driven', 'feature comparison',
];
