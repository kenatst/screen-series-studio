CREATE TABLE public.project_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slide_number integer NOT NULL,
  target_language text NOT NULL,
  source_language text NOT NULL DEFAULT 'English',
  storage_path text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.project_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own translations"
  ON public.project_translations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own translations"
  ON public.project_translations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own translations"
  ON public.project_translations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);