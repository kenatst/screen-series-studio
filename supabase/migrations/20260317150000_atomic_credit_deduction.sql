-- Atomic credit deduction function to prevent race conditions
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id uuid, p_amount integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_credits integer;
BEGIN
  UPDATE profiles
  SET credits = GREATEST(0, credits - p_amount)
  WHERE id = p_user_id AND credits >= p_amount
  RETURNING credits INTO new_credits;

  IF NOT FOUND THEN
    RETURN -1; -- Insufficient credits
  END IF;

  RETURN new_credits;
END;
$$;

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION deduct_credits(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(uuid, integer) TO service_role;
