-- Ensure multi-format translation persistence always has the expected column.
ALTER TABLE public.project_translations
  ADD COLUMN IF NOT EXISTS device_format text NOT NULL DEFAULT 'iphone-6-5';

-- Remove duplicate translation rows before enforcing uniqueness.
DELETE FROM public.project_translations a
USING public.project_translations b
WHERE a.ctid < b.ctid
  AND a.project_id = b.project_id
  AND a.slide_number = b.slide_number
  AND a.target_language = b.target_language
  AND COALESCE(a.device_format, 'iphone-6-5') = COALESCE(b.device_format, 'iphone-6-5');

-- Prevent duplicate translations for the same slide/language/format.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_project_translation
  ON public.project_translations(project_id, slide_number, target_language, device_format);

-- Database-backed rate limiting buckets.
CREATE TABLE IF NOT EXISTS public.function_rate_limits (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, function_name, window_start)
);

CREATE INDEX IF NOT EXISTS idx_function_rate_limits_window
  ON public.function_rate_limits(window_start);

ALTER TABLE public.function_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.function_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.function_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.check_function_rate_limit(
  p_user_id uuid,
  p_function_name text,
  p_limit integer,
  p_window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bucket_start timestamptz;
  next_count integer;
BEGIN
  IF p_user_id IS NULL OR COALESCE(trim(p_function_name), '') = '' THEN
    RETURN FALSE;
  END IF;

  IF p_limit IS NULL OR p_limit <= 0 THEN
    RETURN TRUE;
  END IF;

  IF p_window_seconds IS NULL OR p_window_seconds <= 0 THEN
    p_window_seconds := 60;
  END IF;

  bucket_start := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);

  INSERT INTO public.function_rate_limits (user_id, function_name, window_start, request_count, updated_at)
  VALUES (p_user_id, p_function_name, bucket_start, 1, now())
  ON CONFLICT (user_id, function_name, window_start)
  DO UPDATE SET
    request_count = public.function_rate_limits.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO next_count;

  DELETE FROM public.function_rate_limits
  WHERE window_start < now() - interval '1 day';

  RETURN next_count <= p_limit;
END;
$$;

-- Lock down privileged helper functions so only service-role callers can execute them.
REVOKE ALL ON FUNCTION public.debit_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.debit_credits(uuid, integer) TO service_role;

REVOKE ALL ON FUNCTION public.credit_credits(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_credits(uuid, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.check_function_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_function_rate_limit(uuid, text, integer, integer) TO service_role;
