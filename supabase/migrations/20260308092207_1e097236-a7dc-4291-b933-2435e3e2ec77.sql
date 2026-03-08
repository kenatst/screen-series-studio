
-- Update the plan check constraint to use new plan names
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'starter', 'pro', 'unlimited'));
-- Update any existing 'single' plans to 'starter', 'multi' to 'pro'
UPDATE public.profiles SET plan = 'starter' WHERE plan = 'single';
UPDATE public.profiles SET plan = 'pro' WHERE plan = 'multi';
