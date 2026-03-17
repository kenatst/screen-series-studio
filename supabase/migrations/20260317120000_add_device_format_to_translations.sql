-- Add device_format column to project_translations for multi-format translation support
ALTER TABLE public.project_translations ADD COLUMN IF NOT EXISTS device_format text NOT NULL DEFAULT 'iphone-6-5';

-- Add index for efficient lookups by project + language + format
CREATE INDEX IF NOT EXISTS idx_project_translations_project_lang_format
  ON public.project_translations(project_id, target_language, device_format);
