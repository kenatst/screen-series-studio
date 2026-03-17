-- Create project_translations table to persist translated slide images
CREATE TABLE IF NOT EXISTS public.project_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slide_number INTEGER NOT NULL,
  target_language TEXT NOT NULL,
  source_language TEXT NOT NULL DEFAULT 'English',
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast lookups by project + language
CREATE INDEX idx_project_translations_project_lang
  ON public.project_translations(project_id, target_language);

-- RLS
ALTER TABLE public.project_translations ENABLE ROW LEVEL SECURITY;

-- Users can read their own translations
CREATE POLICY "Users can read own translations"
  ON public.project_translations FOR SELECT
  USING (auth.uid() = user_id);

-- Service role inserts (from edge functions)
CREATE POLICY "Service role can insert translations"
  ON public.project_translations FOR INSERT
  WITH CHECK (true);

-- Users can delete their own translations
CREATE POLICY "Users can delete own translations"
  ON public.project_translations FOR DELETE
  USING (auth.uid() = user_id);
