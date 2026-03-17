-- Add device_format column to project_translations
ALTER TABLE public.project_translations ADD COLUMN device_format text NOT NULL DEFAULT 'iphone-6-5';

-- Add unique constraint to prevent duplicate translations
CREATE UNIQUE INDEX idx_unique_translation ON public.project_translations (project_id, slide_number, target_language, device_format);

-- Add composite index for fast lookups
CREATE INDEX idx_translations_project_lang_format ON public.project_translations (project_id, target_language, device_format);