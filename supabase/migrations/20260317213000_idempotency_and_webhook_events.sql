-- Idempotency keys for edge function calls (DB-backed, cross-cold-start).
CREATE TABLE IF NOT EXISTS public.function_idempotency_keys (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, function_name, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_function_idempotency_created_at
  ON public.function_idempotency_keys(created_at);

ALTER TABLE public.function_idempotency_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.function_idempotency_keys FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.function_idempotency_keys TO service_role;

CREATE OR REPLACE FUNCTION public.claim_function_idempotency(
  p_user_id uuid,
  p_function_name text,
  p_idempotency_key text,
  p_ttl_seconds integer DEFAULT 120
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_inserted integer;
BEGIN
  IF p_user_id IS NULL
    OR COALESCE(trim(p_function_name), '') = ''
    OR COALESCE(trim(p_idempotency_key), '') = '' THEN
    RETURN FALSE;
  END IF;

  IF p_ttl_seconds IS NULL OR p_ttl_seconds <= 0 THEN
    p_ttl_seconds := 120;
  END IF;

  DELETE FROM public.function_idempotency_keys
  WHERE created_at < now() - make_interval(secs => p_ttl_seconds);

  INSERT INTO public.function_idempotency_keys (user_id, function_name, idempotency_key)
  VALUES (p_user_id, p_function_name, p_idempotency_key)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS rows_inserted = ROW_COUNT;
  RETURN rows_inserted = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_function_idempotency(uuid, text, text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_function_idempotency(uuid, text, text, integer)
  TO service_role;

-- Stripe webhook idempotency tracking table.
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at
  ON public.stripe_webhook_events(processed_at);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.stripe_webhook_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.stripe_webhook_events TO service_role;
