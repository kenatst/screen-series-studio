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
  { id: 't1', name: 'Habit Tracker', preview: '', tags: ['minimal', 'professional', 'clean'], bestFor: 'Productivity, habit apps', complexity: 'simple', conversionAngle: 'Trust & clarity', category: 'Lifestyle', slidesSupported: 10, tone: 'corporate' },
  { id: 't2', name: 'AI Coach', preview: '', tags: ['vibrant', 'energetic', 'dynamic'], bestFor: 'Coaching, fitness apps', complexity: 'medium', conversionAngle: 'Motivation', category: 'Entertainment', slidesSupported: 10, tone: 'bold' },
  { id: 't3', name: 'Map Explorer', preview: '', tags: ['clean', 'geographic', 'social'], bestFor: 'Travel, maps, social apps', complexity: 'medium', conversionAngle: 'Discovery', category: 'Lifestyle', slidesSupported: 10, tone: 'minimalist' },
  { id: 't4', name: 'Subscription Manager', preview: '', tags: ['premium', 'gradient', 'sleek'], bestFor: 'Finance, subscription apps', complexity: 'complex', conversionAngle: 'Cost savings', category: 'Business', slidesSupported: 10, tone: 'premium' },
  { id: 't5', name: 'Hydration', preview: '', tags: ['playful', 'colorful', 'friendly'], bestFor: 'Health, wellness apps', complexity: 'simple', conversionAngle: 'Fun & health', category: 'Lifestyle', slidesSupported: 10, tone: 'playful' },
  { id: 't6', name: 'Sugar Free', preview: '', tags: ['organic', 'warm', 'aspirational'], bestFor: 'Diet, nutrition apps', complexity: 'simple', conversionAngle: 'Lifestyle change', category: 'Lifestyle', slidesSupported: 10, tone: 'minimalist' },
  { id: 't7', name: 'Aura Mood', preview: '', tags: ['luxury', 'minimal', 'elegant'], bestFor: 'Meditation, mindfulness', complexity: 'simple', conversionAngle: 'Inner peace', category: 'Luxury', slidesSupported: 7, tone: 'premium' },
  { id: 't8', name: 'Scribe Notes', preview: '', tags: ['structured', 'feature-focused', 'clear'], bestFor: 'Note-taking, productivity', complexity: 'medium', conversionAngle: 'Feature showcase', category: 'Business', slidesSupported: 10, tone: 'corporate' },
  { id: 't9', name: 'Personal Trainer', preview: '', tags: ['bold', 'energetic', 'dynamic'], bestFor: 'Fitness, workout apps', complexity: 'complex', conversionAngle: 'Transformation', category: 'Entertainment', slidesSupported: 10, tone: 'bold' },
  { id: 't10', name: 'Stackr Finance', preview: '', tags: ['premium', 'gradient', 'data-driven'], bestFor: 'Fintech, investment apps', complexity: 'complex', conversionAngle: 'Financial growth', category: 'Business', slidesSupported: 10, tone: 'premium' },
  { id: 't11', name: 'Trainer AI', preview: '', tags: ['futuristic', 'bold', 'tech'], bestFor: 'AI-powered fitness', complexity: 'complex', conversionAngle: 'Smart training', category: 'Entertainment', slidesSupported: 10, tone: 'bold' },
  { id: 't12', name: 'Stackr Yellow', preview: '', tags: ['vibrant', 'modern', 'bold'], bestFor: 'Finance, crypto apps', complexity: 'medium', conversionAngle: 'Bold positioning', category: 'Business', slidesSupported: 10, tone: 'bold' },
  { id: 't13', name: 'Vow Couples', preview: '', tags: ['romantic', 'warm', 'elegant'], bestFor: 'Dating, relationship apps', complexity: 'medium', conversionAngle: 'Emotional connection', category: 'Lifestyle', slidesSupported: 10, tone: 'premium' },
  { id: 't14', name: 'RPG Gaming', preview: '', tags: ['gaming', 'immersive', 'dramatic'], bestFor: 'Games, RPG apps', complexity: 'complex', conversionAngle: 'Excitement & adventure', category: 'Entertainment', slidesSupported: 10, tone: 'bold' },
  { id: 't15', name: 'Cram Study', preview: '', tags: ['playful', 'educational', 'colorful'], bestFor: 'Study, flashcard apps', complexity: 'medium', conversionAngle: 'Learning made easy', category: 'Education', slidesSupported: 10, tone: 'playful' },
  { id: 't16', name: 'AdBlock Shield', preview: '', tags: ['tech', 'minimal', 'powerful'], bestFor: 'Utility, security apps', complexity: 'simple', conversionAngle: 'Protection', category: 'Business', slidesSupported: 7, tone: 'corporate' },
  { id: 't17', name: 'Drift Meditation', preview: '', tags: ['calm', 'minimal', 'serene'], bestFor: 'Meditation, sleep apps', complexity: 'simple', conversionAngle: 'Relaxation', category: 'Luxury', slidesSupported: 10, tone: 'minimalist' },
  { id: 't18', name: 'Life Coaching', preview: '', tags: ['professional', 'warm', 'inspiring'], bestFor: 'Coaching, self-improvement', complexity: 'medium', conversionAngle: 'Personal growth', category: 'Education', slidesSupported: 10, tone: 'corporate' },
  { id: 't19', name: 'Tape Recorder', preview: '', tags: ['retro', 'creative', 'unique'], bestFor: 'Audio, music apps', complexity: 'medium', conversionAngle: 'Nostalgia & creativity', category: 'Media', slidesSupported: 7, tone: 'bold' },
  { id: 't20', name: 'Solo Travel', preview: '', tags: ['adventurous', 'organic', 'free'], bestFor: 'Travel, adventure apps', complexity: 'medium', conversionAngle: 'Freedom & discovery', category: 'Lifestyle', slidesSupported: 10, tone: 'minimalist' },
  { id: 't21', name: 'MindDrop Journal', preview: '', tags: ['calm', 'minimal', 'thoughtful'], bestFor: 'Journaling, mental health', complexity: 'simple', conversionAngle: 'Self-reflection', category: 'Lifestyle', slidesSupported: 10, tone: 'minimalist' },
  { id: 't22', name: 'Meal Planner', preview: '', tags: ['fresh', 'colorful', 'friendly'], bestFor: 'Meal prep, recipe apps', complexity: 'medium', conversionAngle: 'Healthy lifestyle', category: 'Lifestyle', slidesSupported: 10, tone: 'playful' },
  { id: 't23', name: 'Vault Security', preview: '', tags: ['dark', 'premium', 'secure'], bestFor: 'Password, security apps', complexity: 'medium', conversionAngle: 'Trust & safety', category: 'Business', slidesSupported: 7, tone: 'premium' },
  { id: 't24', name: 'LinguaFlow', preview: '', tags: ['playful', 'educational', 'colorful'], bestFor: 'Language learning apps', complexity: 'medium', conversionAngle: 'Fun learning', category: 'Education', slidesSupported: 10, tone: 'playful' },
  { id: 't25', name: 'Nestle Wellness', preview: '', tags: ['organic', 'clean', 'premium'], bestFor: 'Health, corporate wellness', complexity: 'simple', conversionAngle: 'Trusted brand', category: 'Lifestyle', slidesSupported: 10, tone: 'corporate' },
  { id: 't26', name: 'LifePlan Goals', preview: '', tags: ['structured', 'motivating', 'clear'], bestFor: 'Goal tracking, planning', complexity: 'medium', conversionAngle: 'Achievement', category: 'Business', slidesSupported: 10, tone: 'corporate' },
  { id: 't27', name: 'FoxLearn Kids', preview: '', tags: ['playful', 'character', 'fun'], bestFor: 'Kids education, games', complexity: 'complex', conversionAngle: 'Fun & safe', category: 'Education', slidesSupported: 10, tone: 'playful' },
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
