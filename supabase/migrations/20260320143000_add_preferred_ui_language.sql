ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_ui_language TEXT;

UPDATE public.profiles
SET preferred_ui_language = 'en'
WHERE preferred_ui_language IS NULL;

ALTER TABLE public.profiles
ALTER COLUMN preferred_ui_language SET DEFAULT 'en';

ALTER TABLE public.profiles
ALTER COLUMN preferred_ui_language SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_preferred_ui_language_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_preferred_ui_language_check
      CHECK (preferred_ui_language IN ('en', 'fr', 'de', 'es', 'zh', 'ja', 'hi', 'tr', 'ar'));
  END IF;
END
$$;
