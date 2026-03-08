
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'single', 'multi', 'unlimited')),
  credits INTEGER NOT NULL DEFAULT 1,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROJECTS
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  app_name TEXT,
  app_description TEXT,
  platform TEXT DEFAULT 'both' CHECK (platform IN ('ios', 'android', 'both')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed')),
  generation_mode TEXT DEFAULT 'full' CHECK (generation_mode IN ('full', 'creative-direction', 'first-3')),
  device_formats JSONB DEFAULT '["iphone-6-9"]'::jsonb,
  consistency_level TEXT DEFAULT 'balanced' CHECK (consistency_level IN ('strict', 'balanced', 'exploratory')),
  template_id TEXT DEFAULT 'clean-saas',
  brand_kit JSONB DEFAULT '{}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PROJECT_SLIDES
CREATE TABLE public.project_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  slide_number INTEGER NOT NULL,
  objective TEXT,
  headline TEXT,
  subheadline TEXT,
  raw_screen_tag TEXT,
  emphasis TEXT,
  importance TEXT DEFAULT 'medium' CHECK (importance IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'error')),
  image_url TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own slides" ON public.project_slides FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_slides.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users insert own slides" ON public.project_slides FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_slides.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users update own slides" ON public.project_slides FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_slides.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users delete own slides" ON public.project_slides FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_slides.project_id AND projects.user_id = auth.uid())
);

-- ASSETS
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('raw_screen', 'logo', 'mascot', 'reference', 'icon')),
  tag TEXT,
  storage_path TEXT NOT NULL,
  filename TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('raw-uploads', 'raw-uploads', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-outputs', 'generated-outputs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', true);

-- Storage policies: raw-uploads
CREATE POLICY "Users upload own raw files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'raw-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own raw files" ON storage.objects FOR SELECT USING (bucket_id = 'raw-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own raw files" ON storage.objects FOR DELETE USING (bucket_id = 'raw-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: generated-outputs
CREATE POLICY "Users read own generated files" ON storage.objects FOR SELECT USING (bucket_id = 'generated-outputs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Service role inserts generated files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'generated-outputs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: templates (public read)
CREATE POLICY "Anyone can read templates" ON storage.objects FOR SELECT USING (bucket_id = 'templates');
