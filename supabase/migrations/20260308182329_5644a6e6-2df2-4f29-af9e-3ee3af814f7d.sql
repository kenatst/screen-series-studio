ALTER TABLE public.project_slides 
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quality_score integer,
  ADD COLUMN IF NOT EXISTS generation_ms integer,
  ADD COLUMN IF NOT EXISTS last_error text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS output_language text NOT NULL DEFAULT 'en';